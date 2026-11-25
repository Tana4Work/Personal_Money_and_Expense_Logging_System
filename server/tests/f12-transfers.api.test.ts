import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F12TestPassword123!";
const emails = { user: "f12.user@test.local", otherUser: "f12.other-user@test.local", admin: "f12.admin@test.local" };
let userId: number;
let bankAccountId: number;
let walletAccountId: number;
let otherWalletAccountId: number;
let diningAccountId: number;

async function cleanupFixture() {
  const users = await prisma.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
  const userIds = users.map(({ id }) => id);
  if (userIds.length === 0) return;
  await prisma.transaction.deleteMany({ where: { ownerUserId: { in: userIds } } });
  await prisma.account.deleteMany({ where: { ownerUserId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

beforeAll(async () => {
  await cleanupFixture();
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name: "F12 User", email: emails.user, passwordHash, role: UserRole.USER } });
  userId = user.id;
  const otherUser = await prisma.user.create({ data: { name: "F12 Other User", email: emails.otherUser, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F12 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "500" } })).id;
  walletAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
  diningAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  otherWalletAccountId = (await prisma.account.create({ data: { ownerUserId: otherUser.id, name: "Other Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
});

beforeEach(async () => {
  await prisma.transaction.deleteMany({ where: { ownerUserId: userId } });
  await prisma.account.update({ where: { id: bankAccountId }, data: { openingBalance: "500" } });
  await prisma.account.update({ where: { id: walletAccountId }, data: { openingBalance: "0" } });
});

afterAll(async () => {
  await cleanupFixture();
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.token as string;
}

async function getBalance(token: string, accountId: number) {
  const response = await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200);
  return response.body.accounts.find((account: { accountId: number }) => account.accountId === accountId)?.balance as string;
}

async function getCounts() {
  return {
    transactions: await prisma.transaction.count({ where: { ownerUserId: userId } }),
    allocations: await prisma.allocationLine.count({ where: { transaction: { ownerUserId: userId } } }),
  };
}

describe("F-12 transfers and shared Cash-outflow rules", () => {
  it("TEST-60 transfers money and persists the note without changing summaries", async () => {
    const token = await login(emails.user);
    const summaryBefore = await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200);
    const response = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "250.00", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId, note: " ATM ",
    }).expect(201);

    expect(response.body).toMatchObject({
      formType: "PAYMENT_OR_CHARGE", totalAmount: "250", note: "ATM",
      sourceAccount: { id: bankAccountId }, receivingAccount: { id: walletAccountId },
    });
    expect(response.body.allocations).toHaveLength(1);
    expect(response.body.allocations[0]).toMatchObject({ allocationType: "TRANSFER", amount: "250", account: { id: walletAccountId } });
    expect(response.body.updatedAt).toEqual(expect.any(String));
    expect(await getBalance(token, bankAccountId)).toBe("250");
    expect(await getBalance(token, walletAccountId)).toBe("250");
    const summaryAfter = await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200);
    expect(summaryAfter.body).toEqual(summaryBefore.body);
    const history = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200);
    expect(history.body.find((transaction: { id: number }) => transaction.id === response.body.id).note).toBe("ATM");
  });

  it("TEST-61 rejects a transfer above balance and accepts one that leaves exactly zero", async () => {
    const token = await login(emails.user);
    const before = await getCounts();
    const rejected = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "500.01", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId,
    }).expect(400);
    expect(rejected.body).toEqual({ error: "Insufficient balance in the source cash account." });
    expect(JSON.stringify(rejected.body)).not.toContain("500");
    expect(await getCounts()).toEqual(before);

    await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "500.00", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId,
    }).expect(201);
    expect(await getBalance(token, bankAccountId)).toBe("0");
  });

  it("TEST-62 serializes concurrent transfers so the source never becomes negative", async () => {
    const token = await login(emails.user);
    const responses = await Promise.all(["300", "300"].map((totalAmount) => request(app)
      .post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
        totalAmount, date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId,
      })));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
    expect(await prisma.transaction.count({ where: { ownerUserId: userId } })).toBe(1);
    expect(await getBalance(token, bankAccountId)).toBe("200");
  });

  it("TEST-63 rejects same-account, non-Cash, and cross-owner transfers without writes", async () => {
    const token = await login(emails.user);
    const before = await getCounts();
    const sameAccount = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: bankAccountId,
    }).expect(400);
    expect(sameAccount.body).toEqual({ error: "Transfer accounts must be different." });
    const nonCash = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: diningAccountId,
    }).expect(400);
    expect(nonCash.body).toEqual({ error: "Transfers must use cash accounts." });
    await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: otherWalletAccountId,
    }).expect(403);
    expect(await getCounts()).toEqual(before);
  });

  it("TEST-64 applies BR-12 to Cash-source payments", async () => {
    const token = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "200", date: "2026-11-26", sourceAccountId: bankAccountId,
      allocations: [{ accountId: diningAccountId, allocationType: "EXPENSE", amount: "200" }],
    }).expect(201);
    expect(await getBalance(token, bankAccountId)).toBe("300");
    const before = await getCounts();
    const rejected = await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "300.01", date: "2026-11-26", sourceAccountId: bankAccountId,
      allocations: [{ accountId: diningAccountId, allocationType: "EXPENSE", amount: "300.01" }],
    }).expect(400);
    expect(rejected.body).toEqual({ error: "Insufficient balance in the source cash account." });
    expect(await getCounts()).toEqual(before);
  });

  it("TEST-65 rejects a receive-form transfer from a Cash account with insufficient balance", async () => {
    const token = await login(emails.user);
    const before = await getCounts();
    const response = await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "50", date: "2026-11-26", receivingAccountId: bankAccountId,
      allocations: [{ accountId: walletAccountId, allocationType: "TRANSFER", amount: "50" }],
    }).expect(400);
    expect(response.body).toEqual({ error: "Insufficient balance in the source cash account." });
    expect(await getCounts()).toEqual(before);
  });

  it("TEST-66 checks 2-decimal amounts and the optional-note length boundary", async () => {
    const token = await login(emails.user);
    const salary = await prisma.account.create({ data: { ownerUserId: userId, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } });
    const response = await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10.005", date: "2026-11-26", receivingAccountId: bankAccountId,
      allocations: [{ accountId: salary.id, allocationType: "INCOME", amount: "10.005" }],
    }).expect(400);
    expect(response.body).toEqual({ error: "A valid positive amount is required." });
    const maximumNote = "x".repeat(200);
    const accepted = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId, note: maximumNote,
    }).expect(201);
    expect(accepted.body.note).toBe(maximumNote);
    const before = await getCounts();
    const longNote = await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${token}`).send({
      totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId, note: "x".repeat(201),
    }).expect(400);
    expect(longNote.body).toEqual({ error: "The note must be 200 characters or fewer." });
    expect(await getCounts()).toEqual(before);
  });

  it("TEST-68 rejects unauthenticated and Administrator access to transfers", async () => {
    const body = { totalAmount: "10", date: "2026-11-26", sourceAccountId: bankAccountId, receivingAccountId: walletAccountId };
    await request(app).post("/api/transactions/transfer").send(body).expect(401);
    const adminToken = await login(emails.admin);
    await request(app).post("/api/transactions/transfer").set("Authorization", `Bearer ${adminToken}`).send(body).expect(403);
    expect(await getCounts()).toEqual({ transactions: 0, allocations: 0 });
  });
});
