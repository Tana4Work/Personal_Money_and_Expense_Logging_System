import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const testPassword = "F03TestPassword123!";
const emails = {
  user: "f03.user@test.local",
  otherUser: "f03.other-user@test.local",
  admin: "f03.admin@test.local",
};
let bankAccountId: number;
let otherBankAccountId: number;
let walletAccountId: number;
let salaryAccountId: number;
let diningAccountId: number;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  const passwordHash = await hashPassword(testPassword);
  const user = await prisma.user.create({ data: { name: "F03 User", email: emails.user, passwordHash, role: UserRole.USER } });
  const otherUser = await prisma.user.create({ data: { name: "F03 Other User", email: emails.otherUser, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F03 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  bankAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Bank Account", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
  walletAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
  salaryAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  diningAccountId = (await prisma.account.create({ data: { ownerUserId: user.id, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
  otherBankAccountId = (await prisma.account.create({ data: { ownerUserId: otherUser.id, name: "Other Bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } })).id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password: testPassword }).expect(200);
  return response.body.token as string;
}

describe("F-03 opening balance", () => {
  it("persists a positive opening balance and calendar date for the user's bank account", async () => {
    const token = await login(emails.user);
    const response = await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`)
      .set("Authorization", `Bearer ${token}`).send({ amount: "1250.50", date: "2026-11-03" }).expect(200);
    expect(response.body).toMatchObject({ id: bankAccountId, openingBalance: "1250.5", openingBalanceDate: "2026-11-03T00:00:00.000Z" });

    const account = await prisma.account.findUniqueOrThrow({ where: { id: bankAccountId } });
    expect(account.openingBalance.toString()).toBe("1250.5");
    expect(account.openingBalanceDate?.toISOString()).toBe("2026-11-03T00:00:00.000Z");
    const accounts = await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(200);
    expect(accounts.body.find((entry: { id: number }) => entry.id === bankAccountId)).toMatchObject({ openingBalance: "1250.5", openingBalanceDate: "2026-11-03T00:00:00.000Z" });
    const categoryAccounts = await prisma.account.findMany({ where: { id: { in: [salaryAccountId, diningAccountId] } } });
    expect(categoryAccounts.every((entry) => entry.openingBalance.isZero() && entry.openingBalanceDate === null)).toBe(true);
  });

  it("accepts zero and repeat submissions replace the saved amount and date", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
      .send({ amount: "0", date: "2026-01-31" }).expect(200);
    const response = await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
      .send({ amount: "42.25", date: "2026-02-28" }).expect(200);
    expect(response.body).toMatchObject({ openingBalance: "42.25", openingBalanceDate: "2026-02-28T00:00:00.000Z" });
  });

  it("rejects negative, malformed, non-finite, and out-of-range amounts", async () => {
    const token = await login(emails.user);
    for (const amount of ["-1", "not-money", "Infinity", "1.0000000000000000000000000000001", "1e40"]) {
      await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
        .send({ amount, date: "2026-11-03" }).expect(400);
    }
    await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-11-03" }).expect(400);
    const account = await prisma.account.findUniqueOrThrow({ where: { id: bankAccountId } });
    expect(account.openingBalance.toString()).toBe("42.25");
    expect(account.openingBalanceDate?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("rejects malformed and impossible calendar dates", async () => {
    const token = await login(emails.user);
    for (const date of ["2026-02-30", "2026-13-01", "not-a-date", "2026-11-03T00:00:00Z"]) {
      await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
        .send({ amount: "0", date }).expect(400);
    }
  });

  it("rejects non-bank account types and leaves category balances unchanged", async () => {
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${walletAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
      .send({ amount: "10", date: "2026-11-03" }).expect(400);
    await request(app).post(`/api/accounts/${salaryAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`)
      .send({ amount: "10", date: "2026-11-03" }).expect(400);
    const categoryAccounts = await prisma.account.findMany({ where: { id: { in: [walletAccountId, salaryAccountId, diningAccountId] } } });
    expect(categoryAccounts.every((account) => account.openingBalance.isZero() && account.openingBalanceDate === null)).toBe(true);
  });

  it("enforces authentication, role, ownership, and account ID checks", async () => {
    const body = { amount: "10", date: "2026-11-03" };
    await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).send(body).expect(401);
    const adminToken = await login(emails.admin);
    await request(app).post(`/api/accounts/${bankAccountId}/opening-balance`).set("Authorization", `Bearer ${adminToken}`).send(body).expect(403);
    const userToken = await login(emails.user);
    await request(app).post(`/api/accounts/${otherBankAccountId}/opening-balance`).set("Authorization", `Bearer ${userToken}`).send(body).expect(403);
    await request(app).post("/api/accounts/invalid/opening-balance").set("Authorization", `Bearer ${userToken}`).send(body).expect(400);
    await request(app).post("/api/accounts/999999/opening-balance").set("Authorization", `Bearer ${userToken}`).send(body).expect(404);
  });
});
