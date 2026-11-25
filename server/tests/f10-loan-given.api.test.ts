import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F10TestPassword123!";
const emails = { user: "f10.user@test.local", other: "f10.other@test.local", admin: "f10.admin@test.local" };
let userId: number;
let otherUserId: number;
let bankId: number;
let cardId: number;
let loanGivenId: number;
let salaryId: number;
let diningId: number;
let otherBankId: number;
let otherLoanGivenId: number;

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
  const user = await prisma.user.create({ data: { name: "F10 User", email: emails.user, passwordHash, role: UserRole.USER } });
  userId = user.id;
  const other = await prisma.user.create({ data: { name: "F10 Other", email: emails.other, passwordHash, role: UserRole.USER } });
  otherUserId = other.id;
  await prisma.user.create({ data: { name: "F10 Admin", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "2000" } })).id;
  cardId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } })).id;
  loanGivenId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Loan to Somchai", type: AccountType.LOAN_GIVEN, subtype: AccountSubtype.OTHER } })).id;
  salaryId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  diningId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  otherBankId = (await prisma.account.create({ data: { ownerUserId: otherUserId, name: "Other bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
  otherLoanGivenId = (await prisma.account.create({ data: { ownerUserId: otherUserId, name: "Other loan", type: AccountType.LOAN_GIVEN, subtype: AccountSubtype.OTHER } })).id;
});

afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

async function login(email: string) {
  return (await request(app).post("/api/auth/login").send({ email, password }).expect(200)).body.token as string;
}

async function counts() {
  const transactions = await prisma.transaction.findMany({ where: { ownerUserId: userId }, select: { id: true } });
  return { transactions: transactions.length, allocations: await prisma.allocationLine.count({ where: { transactionId: { in: transactions.map(({ id }) => id) } } }) };
}

async function balances(token: string) {
  return (await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200)).body.accounts as Array<{ accountId: number; balance: string }>;
}

describe("F-10 loan given", () => {
  it("TEST-47 lends from Cash and persists the outstanding loan", async () => {
    const token = await login(emails.user);
    const created = await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "1000", date: "2026-11-26", sourceAccountId: bankId,
      allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "1000" }],
    }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === bankId)?.balance).toBe("1000");
    expect((await balances(token)).find(({ accountId }) => accountId === loanGivenId)?.balance).toBe("1000");
    expect((await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200)).body.some((entry: { id: number }) => entry.id === created.body.id)).toBe(true);
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body.loansGivenOutstanding).toBe("1000");
  });

  it("TEST-48 receives a loan repayment without classifying it as income or expense", async () => {
    const token = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "1000", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "1000" }] }).expect(201);
    const before = (await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body;
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "400", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "REPAYMENT", amount: "400" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === bankId)?.balance).toBe("1400");
    expect((await balances(token)).find(({ accountId }) => accountId === loanGivenId)?.balance).toBe("600");
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body).toMatchObject({ income: before.income, expenses: before.expenses, loansGivenOutstanding: "600" });
  });

  it("TEST-49 rejects over-repayment but accepts exactly the outstanding amount", async () => {
    const token = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "1000", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "1000" }] }).expect(201);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "400", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "REPAYMENT", amount: "400" }] }).expect(201);
    const before = await counts();
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "600.01", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "REPAYMENT", amount: "600.01" }] }).expect(400, { error: "The repayment is more than the amount owed on this loan." });
    expect(await counts()).toEqual(before);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "600", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "REPAYMENT", amount: "600" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === loanGivenId)?.balance).toBe("0");
  });

  it("TEST-50 applies BR-12 to lending and permits a loan that leaves zero", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${bankId}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "500", date: "2026-11-26" }).expect(200);
    const before = await counts();
    const rejected = await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "500.01", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "500.01" }] }).expect(400);
    expect(rejected.body).toEqual({ error: "Insufficient balance in the source cash account." });
    expect(await counts()).toEqual(before);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "500", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "500" }] }).expect(201);
    expect((await balances(token)).find(({ accountId }) => accountId === bankId)?.balance).toBe("0");
  });

  it("TEST-51 rejects invalid loan allocations and lending from a loan-taken source", async () => {
    const token = await login(emails.user);
    const before = await counts();
    const invalid = [
      { totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: diningId, allocationType: "LOAN_GIVEN", amount: "10" }] },
      { totalAmount: "10", date: "2026-11-26", sourceAccountId: cardId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "10" }] },
      { totalAmount: "10", date: "2026-11-26", receivingAccountId: bankId, allocations: [{ accountId: cardId, allocationType: "REPAYMENT", amount: "10" }] },
    ];
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send(invalid[0]).expect(400);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send(invalid[1]).expect(400);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send(invalid[2]).expect(400);
    expect(await counts()).toEqual(before);
  });

  it("TEST-52 enforces ownership and role access and keeps summaries private", async () => {
    const token = await login(emails.user);
    const otherToken = await login(emails.other);
    const before = await counts();
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: otherLoanGivenId, allocationType: "LOAN_GIVEN", amount: "10" }] }).expect(403);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: otherBankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "10" }] }).expect(403);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${adminToken}`).send({ totalAmount: "10", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "10" }] }).expect(403);
    expect(await counts()).toEqual(before);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "200", date: "2026-11-26", sourceAccountId: bankId, allocations: [{ accountId: loanGivenId, allocationType: "LOAN_GIVEN", amount: "200" }] }).expect(201);
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${otherToken}`).expect(200)).body.loansGivenOutstanding).toBe("0");
  });
});
