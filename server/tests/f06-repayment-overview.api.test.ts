import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F06TestPassword123!";
const emails = { user: "f06.user@test.local", otherUser: "f06.other-user@test.local", admin: "f06.admin@test.local" };
let bankAccountId: number;
let cardAccountId: number;
let salaryAccountId: number;
let diningAccountId: number;
let groceriesAccountId: number;
let otherBankAccountId: number;
let otherCardAccountId: number;
let userId: number;

async function cleanupFixture() {
  const existingUsers = await prisma.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
  const userIds = existingUsers.map(({ id }) => id);
  if (userIds.length === 0) return;
  await prisma.transaction.deleteMany({ where: { ownerUserId: { in: userIds } } });
  await prisma.account.deleteMany({ where: { ownerUserId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

beforeAll(async () => {
  await cleanupFixture();
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name: "F06 User", email: emails.user, passwordHash, role: UserRole.USER } });
  userId = user.id;
  const otherUser = await prisma.user.create({ data: { name: "F06 Other User", email: emails.otherUser, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F06 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Bank Account", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
  cardAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } })).id;
  salaryAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  diningAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  groceriesAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Groceries", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  otherBankAccountId = (await prisma.account.create({ data: { ownerUserId: otherUser.id, name: "Other Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
  otherCardAccountId = (await prisma.account.create({ data: { ownerUserId: otherUser.id, name: "Other Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } })).id;
});

afterAll(async () => {
  await cleanupFixture();
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.token as string;
}

async function prepareRepaymentScenario(openingBalance: string, cardDebt: string) {
  await prisma.transaction.deleteMany({ where: { ownerUserId: userId } });
  await prisma.account.update({
    where: { id: bankAccountId },
    data: { openingBalance, openingBalanceDate: new Date("2026-11-04T00:00:00.000Z") },
  });
  const token = await login(emails.user);
  await request(app)
    .post("/api/transactions/payment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      totalAmount: cardDebt,
      date: "2026-11-04",
      sourceAccountId: cardAccountId,
      allocations: [{ accountId: diningAccountId, allocationType: "EXPENSE", amount: cardDebt }],
    })
    .expect(201);
  return token;
}

async function getBalance(token: string, accountId: number) {
  const response = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
  return response.body.accounts.find((account: { accountId: number }) => account.accountId === accountId)?.balance as string;
}

async function getUserTransactionCounts() {
  const transactions = await prisma.transaction.findMany({ where: { ownerUserId: userId }, select: { id: true } });
  const allocations = await prisma.allocationLine.count({ where: { transactionId: { in: transactions.map(({ id }) => id) } } });
  return { transactions: transactions.length, allocations };
}

describe("F-06 credit-card repayment and overview", () => {
  it("completes and retrieves the full Sprint 1 journey with correct final values", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "10000", date: "2026-11-04" }).expect(200);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "30000", date: "2026-11-04", receivingAccountId: bankAccountId, allocations: [{ accountId: salaryAccountId, allocationType: "INCOME", amount: "30000" }] }).expect(201);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: cardAccountId, allocations: [{ accountId: diningAccountId, allocationType: "EXPENSE", amount: "800" }, { accountId: groceriesAccountId, allocationType: "EXPENSE", amount: "1200" }] }).expect(201);
    const repayment = await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId }).expect(201);
    expect(repayment.body.allocations).toEqual([expect.objectContaining({ allocationType: "REPAYMENT", amount: "2000", account: { id: cardAccountId, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" } })]);

    const balances = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
    expect(balances.body.accounts.find((entry: { accountId: number }) => entry.accountId === bankAccountId)).toEqual({ accountId: bankAccountId, balance: "38000" });
    expect(balances.body.accounts.find((entry: { accountId: number }) => entry.accountId === cardAccountId)).toEqual({ accountId: cardAccountId, balance: "0" });
    const summary = await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200);
    expect(summary.body).toMatchObject({ income: "30000", expenses: "2000", loansGivenOutstanding: "0", loansTakenOutstanding: "0" });
    const history = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200);
    expect(history.body).toHaveLength(3);
    expect(history.body.some((entry: { id: number }) => entry.id === repayment.body.id)).toBe(true);
    await request(app).get(`/api/transactions/${repayment.body.id}`).set("Authorization", `Bearer ${token}`).expect(200);
  });

  it("rejects invalid account combinations and cross-owner repayment without partial writes", async () => {
    const token = await login(emails.user);
    const before = await prisma.transaction.count();
    for (const body of [
      { totalAmount: "0", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId },
      { totalAmount: "-1", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId },
      { totalAmount: "not-money", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId },
      { totalAmount: "2000", date: "2026-02-30", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId },
      { totalAmount: "2000", date: "2026-11-04", sourceAccountId: cardAccountId, receivingAccountId: cardAccountId },
      { totalAmount: "2000", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: bankAccountId },
    ]) await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send(body).expect(400);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: otherBankAccountId, receivingAccountId: cardAccountId }).expect(403);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: otherCardAccountId }).expect(403);
    expect(await prisma.transaction.count()).toBe(before);
  });

  it("rejects unauthenticated and administrator repayment", async () => {
    const before = await prisma.transaction.count();
    await request(app).post("/api/transactions/repayment").send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId }).expect(401);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/repayment").set("Authorization", `Bearer ${adminToken}`).send({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId }).expect(403);
    expect(await prisma.transaction.count()).toBe(before);
  });

  it("TEST-28 rejects repayment above the bank balance without writing or exposing a balance", async () => {
    const token = await prepareRepaymentScenario("500", "600");
    const countsBefore = await getUserTransactionCounts();
    const balancesBefore = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);

    const response = await request(app)
      .post("/api/transactions/repayment")
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: "500.01", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId })
      .expect(400);

    expect(response.body).toEqual({ error: "Insufficient bank balance for this repayment." });
    expect(await getUserTransactionCounts()).toEqual(countsBefore);
    const balancesAfter = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
    expect(balancesAfter.body).toEqual(balancesBefore.body);
  });

  it("TEST-29 accepts repayment that leaves the bank balance at exactly zero", async () => {
    const token = await prepareRepaymentScenario("500", "600");

    await request(app)
      .post("/api/transactions/repayment")
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: "500", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId })
      .expect(201);

    expect(await getBalance(token, bankAccountId)).toBe("0");
  });

  it("TEST-30 serializes competing repayments so the bank balance never becomes negative", async () => {
    const token = await prepareRepaymentScenario("500", "600");

    const responses = await Promise.all(["300", "300"].map((totalAmount) =>
      request(app)
        .post("/api/transactions/repayment")
        .set("Authorization", `Bearer ${token}`)
        .send({ totalAmount, date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId }),
    ));

    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
    expect(await prisma.transaction.count({ where: { ownerUserId: userId } })).toBe(2);
    expect(await getBalance(token, bankAccountId)).toBe("200");
  });

  it("TEST-32 continues to accept repayment above the credit-card debt", async () => {
    const token = await prepareRepaymentScenario("1000", "100");

    await request(app)
      .post("/api/transactions/repayment")
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: "300", date: "2026-11-04", sourceAccountId: bankAccountId, receivingAccountId: cardAccountId })
      .expect(201);

    expect(await getBalance(token, bankAccountId)).toBe("700");
    expect(await getBalance(token, cardAccountId)).toBe("200");
  });
});
