import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F04TestPassword123!";
const emails = { user: "f04.user@test.local", otherUser: "f04.other-user@test.local", admin: "f04.admin@test.local" };
let bankAccountId: number;
let walletAccountId: number;
let incomeAccountId: number;
let otherBankAccountId: number;

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
  const user = await prisma.user.create({ data: { name: "F04 User", email: emails.user, passwordHash, role: UserRole.USER } });
  const otherUser = await prisma.user.create({ data: { name: "F04 Other User", email: emails.otherUser, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F04 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Bank Account", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "10000" } })).id;
  walletAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
  incomeAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  otherBankAccountId = (await prisma.account.create({ data: { ownerUserId: otherUser.id, name: "Other Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
});

afterAll(async () => {
  await cleanupFixture();
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.token as string;
}

function receiveBody(overrides: Record<string, unknown> = {}) {
  return {
    totalAmount: "30000",
    date: "2026-11-04",
    receivingAccountId: bankAccountId,
    allocations: [{ accountId: incomeAccountId, allocationType: "INCOME", amount: "30000" }],
    ...overrides,
  };
}

describe("F-04 receive money", () => {
  it("persists salary, updates balance and income summary, and returns history", async () => {
    const token = await login(emails.user);
    const created = await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send(receiveBody()).expect(201);
    expect(created.body).toMatchObject({ formType: "RECEIVE_MONEY", totalAmount: "30000", receivingAccount: { id: bankAccountId, name: "Bank Account" } });
    expect(created.body.allocations).toEqual([expect.objectContaining({ allocationType: "INCOME", amount: "30000", account: { id: incomeAccountId, name: "Salary", type: "INCOME", subtype: "OTHER" } })]);

    const transaction = await prisma.transaction.findUnique({ where: { id: created.body.id }, include: { allocations: true } });
    expect(transaction?.totalAmount.toString()).toBe("30000");
    expect(transaction?.allocations).toHaveLength(1);

    const balances = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
    expect(balances.body.accounts.find((entry: { accountId: number }) => entry.accountId === bankAccountId)).toEqual({ accountId: bankAccountId, balance: "40000" });
    await expect(request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).resolves.toMatchObject({ body: { income: "30000", expenses: "0" } });
    const history = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200);
    expect(history.body.some((entry: { id: number }) => entry.id === created.body.id)).toBe(true);
    await request(app).get(`/api/transactions/${created.body.id}`).set("Authorization", `Bearer ${token}`).expect(200);
  });

  it("accepts a wallet and rejects invalid account or allocation combinations", async () => {
    const token = await login(emails.user);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send(receiveBody({ receivingAccountId: walletAccountId })).expect(201);
    for (const body of [
      receiveBody({ totalAmount: "0" }),
      receiveBody({ totalAmount: "-1" }),
      receiveBody({ totalAmount: "not-money" }),
      receiveBody({ date: "2026-02-30" }),
      receiveBody({ allocations: [{ accountId: incomeAccountId, allocationType: "INCOME", amount: "29999" }] }),
      receiveBody({ receivingAccountId: incomeAccountId }),
    ]) await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send(body).expect(400);
  });

  it("rejects unauthenticated, administrator, and cross-owner operations without partial writes", async () => {
    const before = await prisma.transaction.count();
    await request(app).post("/api/transactions/receive").send(receiveBody()).expect(401);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${adminToken}`).send(receiveBody()).expect(403);
    const userToken = await login(emails.user);
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${userToken}`).send(receiveBody({ receivingAccountId: otherBankAccountId })).expect(403);
    const after = await prisma.transaction.count();
    expect(after).toBe(before);
  });
});
