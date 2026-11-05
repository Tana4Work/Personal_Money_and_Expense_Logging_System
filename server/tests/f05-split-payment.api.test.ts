import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F05TestPassword123!";
const emails = { user: "f05.user@test.local", otherUser: "f05.other-user@test.local", admin: "f05.admin@test.local" };
let cardAccountId: number;
let diningAccountId: number;
let groceriesAccountId: number;
let otherCardAccountId: number;

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
  const user = await prisma.user.create({ data: { name: "F05 User", email: emails.user, passwordHash, role: UserRole.USER } });
  const otherUser = await prisma.user.create({ data: { name: "F05 Other User", email: emails.otherUser, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F05 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  cardAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } })).id;
  diningAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  groceriesAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Groceries", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
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

function paymentBody(overrides: Record<string, unknown> = {}) {
  return {
    totalAmount: "2000",
    date: "2026-11-04",
    sourceAccountId: cardAccountId,
    allocations: [
      { accountId: diningAccountId, allocationType: "EXPENSE", amount: "800" },
      { accountId: groceriesAccountId, allocationType: "EXPENSE", amount: "1200" },
    ],
    ...overrides,
  };
}

describe("F-05 split payment", () => {
  it("persists a split credit-card purchase, updates debt and expense summary, and returns history", async () => {
    const token = await login(emails.user);
    const created = await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send(paymentBody()).expect(201);
    expect(created.body).toMatchObject({ formType: "PAYMENT_OR_CHARGE", totalAmount: "2000", sourceAccount: { id: cardAccountId, name: "Credit Card" } });
    expect(created.body.allocations).toEqual([
      expect.objectContaining({ allocationType: "EXPENSE", amount: "800", account: { id: diningAccountId, name: "Dining", type: "EXPENSE", subtype: "OTHER" } }),
      expect.objectContaining({ allocationType: "EXPENSE", amount: "1200", account: { id: groceriesAccountId, name: "Groceries", type: "EXPENSE", subtype: "OTHER" } }),
    ]);

    const transaction = await prisma.transaction.findUnique({ where: { id: created.body.id }, include: { allocations: true } });
    expect(transaction?.totalAmount.toString()).toBe("2000");
    expect(transaction?.sourceAccountId).toBe(cardAccountId);
    expect(transaction?.allocations).toHaveLength(2);

    const balances = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
    expect(balances.body.accounts.find((entry: { accountId: number }) => entry.accountId === cardAccountId)).toEqual({ accountId: cardAccountId, balance: "-2000" });
    const summary = await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200);
    expect(summary.body).toEqual({ income: "0", expenses: "2000" });
    const history = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200);
    expect(history.body.some((entry: { id: number }) => entry.id === created.body.id)).toBe(true);
  });

  it("rejects mismatched, invalid, and non-card combinations without partial writes", async () => {
    const token = await login(emails.user);
    const before = await prisma.transaction.count();
    for (const body of [
      paymentBody({ totalAmount: "0" }),
      paymentBody({ totalAmount: "-1" }),
      paymentBody({ totalAmount: "not-money" }),
      paymentBody({ date: "2026-02-30" }),
      paymentBody({ allocations: [{ accountId: diningAccountId, allocationType: "EXPENSE", amount: "1999" }] }),
      paymentBody({ sourceAccountId: diningAccountId }),
    ]) await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send(body).expect(400);
    expect(await prisma.transaction.count()).toBe(before);
  });

  it("rejects unauthenticated, administrator, and cross-owner source accounts", async () => {
    const before = await prisma.transaction.count();
    await request(app).post("/api/transactions/payment").send(paymentBody()).expect(401);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${adminToken}`).send(paymentBody()).expect(403);
    const userToken = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${userToken}`).send(paymentBody({ sourceAccountId: otherCardAccountId })).expect(403);
    expect(await prisma.transaction.count()).toBe(before);
  });
});
