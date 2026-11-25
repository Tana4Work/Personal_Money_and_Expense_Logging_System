import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F11TestPassword123!";
const emails = { user: "f11.user@test.local", other: "f11.other@test.local", admin: "f11.admin@test.local" };
let userId: number;
let bankId: number;
let walletId: number;
let cardId: number;
let loanTakenId: number;
let salaryId: number;
let diningId: number;
let otherBankId: number;
let otherLoanTakenId: number;

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
  const ids = users.map(({ id }) => id);
  if (ids.length) await prisma.transaction.deleteMany({ where: { ownerUserId: { in: ids } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
}

beforeAll(async () => cleanup());
beforeEach(async () => {
  await cleanup();
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name: "F11 User", email: emails.user, passwordHash, role: UserRole.USER } });
  userId = user.id;
  const other = await prisma.user.create({ data: { name: "F11 Other", email: emails.other, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F11 Admin", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "1000" } })).id;
  walletId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
  cardId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } })).id;
  loanTakenId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Loan from Mom", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.OTHER } })).id;
  salaryId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  diningId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  otherBankId = (await prisma.account.create({ data: { ownerUserId: other.id, name: "Other bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
  otherLoanTakenId = (await prisma.account.create({ data: { ownerUserId: other.id, name: "Other loan", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.OTHER } })).id;
});

afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

async function login(email: string) {
  return (await request(app).post("/api/auth/login").send({ email, password }).expect(200)).body.token as string;
}

async function balances(token: string) {
  return (await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200)).body.accounts as Array<{ accountId: number; balance: string }>;
}

async function counts() {
  const transactions = await prisma.transaction.findMany({ where: { ownerUserId: userId }, select: { id: true } });
  return { transactions: transactions.length, allocations: await prisma.allocationLine.count({ where: { transactionId: { in: transactions.map(({ id }) => id) } } }) };
}

describe("F-11 loan taken and borrowing", () => {
  it("TEST-53 records borrowing as debt and excludes it from income", async () => {
    const token = await login(emails.user);
    const before = (await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body;
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "5000", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanTakenId, allocationType: "BORROWING", amount: "5000" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === bankId)?.balance).toBe("6000");
    expect((await balances(token)).find(({ accountId }) => accountId === loanTakenId)?.balance).toBe("-5000");
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body).toMatchObject({ income: before.income, loansTakenOutstanding: "5000" });
  });

  it("TEST-54 charges purchases to a LOAN_TAKEN/OTHER account", async () => {
    const token = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "300", date: "2026-11-26", sourceAccountId: loanTakenId, allocations: [{ accountId: diningId, allocationType: "EXPENSE", amount: "300" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === loanTakenId)?.balance).toBe("-300");
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body).toMatchObject({ expenses: "300", loansTakenOutstanding: "300" });
  });

  it("TEST-55 repays any loan-taken account from a wallet", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${walletId}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "2000", date: "2026-11-26" }).expect(200);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "5000", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanTakenId, allocationType: "BORROWING", amount: "5000" }] }).expect(201);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "300", date: "2026-11-26", sourceAccountId: loanTakenId, allocations: [{ accountId: diningId, allocationType: "EXPENSE", amount: "300" }] }).expect(201);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "1000", date: "2026-11-26", sourceAccountId: walletId, receivingAccountId: loanTakenId }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === walletId)?.balance).toBe("1000");
    expect((await balances(token)).find(({ accountId }) => accountId === loanTakenId)?.balance).toBe("-4300");
  });

  it("TEST-56 supports a repayment allocation on the payment form and preserves F-06 behavior", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${bankId}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "3000", date: "2026-11-26" }).expect(200);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-26", sourceAccountId: cardId, allocations: [{ accountId: diningId, allocationType: "EXPENSE", amount: "2000" }] }).expect(201);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: cardId, allocationType: "REPAYMENT", amount: "2000" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === cardId)?.balance).toBe("0");
    expect((await balances(token)).find(({ accountId }) => accountId === bankId)?.balance).toBe("1000");
  });

  it("TEST-57 enforces BR-12 for wallet repayment and still permits card overpayment", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${walletId}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "100", date: "2026-11-26" }).expect(200);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "100", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanTakenId, allocationType: "BORROWING", amount: "100" }] }).expect(201);
    const before = await counts();
    const rejected = await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "100.01", date: "2026-11-26", sourceAccountId: walletId, receivingAccountId: loanTakenId }).expect(400);
    expect(rejected.body).toEqual({ error: "Insufficient bank balance for this repayment." });
    expect(await counts()).toEqual(before);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "100", date: "2026-11-26", sourceAccountId: cardId, allocations: [{ accountId: diningId, allocationType: "EXPENSE", amount: "100" }] }).expect(201);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "300", date: "2026-11-26", sourceAccountId: bankId, receivingAccountId: cardId }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === cardId)?.balance).toBe("200");
  });

  it("TEST-58 rejects invalid borrowing, loan-source allocations, and repayment destinations", async () => {
    const token = await login(emails.user);
    const before = await counts();
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: salaryId, allocationType: "BORROWING", amount: "10" }] }).expect(400);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: loanTakenId, allocations: [{ accountId: walletId, allocationType: "TRANSFER", amount: "10" }] }).expect(400);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, receivingAccountId: walletId }).expect(400);
    expect(await counts()).toEqual(before);
  });

  it("TEST-59 enforces account ownership, role, and authentication", async () => {
    const token = await login(emails.user);
    const otherToken = await login(emails.other);
    const before = await counts();
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", receivingAccountId: otherBankId, allocations: [{ accountId: loanTakenId, allocationType: "BORROWING", amount: "10" }] }).expect(403);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, receivingAccountId: otherLoanTakenId }).expect(403);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${adminToken}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, receivingAccountId: loanTakenId }).expect(403);
    await request(app).post("/api/transactions/repayment").send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, receivingAccountId: loanTakenId }).expect(401);
    expect(await counts()).toEqual(before);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "700", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanTakenId, allocationType: "BORROWING", amount: "700" }] }).expect(201);
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${otherToken}`).expect(200)).body.loansTakenOutstanding).toBe("0");
  });
});
