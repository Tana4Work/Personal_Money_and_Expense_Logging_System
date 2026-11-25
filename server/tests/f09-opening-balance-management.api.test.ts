import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F09TestPassword123!";
const emails = { user: "f09.user@test.local", other: "f09.other@test.local", admin: "f09.admin@test.local" };
let userId: number;
let otherAccountId: number;
let categoryAccountId: number;
let expenseAccountId: number;

beforeAll(async () => {
  const existingUsers = await prisma.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
  await prisma.transaction.deleteMany({ where: { ownerUserId: { in: existingUsers.map(({ id }) => id) } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  const passwordHash = await hashPassword(password);
  userId = (await prisma.user.create({ data: { name: "F09 User", email: emails.user, passwordHash, role: UserRole.USER } })).id;
  const other = await prisma.user.create({ data: { name: "F09 Other", email: emails.other, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F09 Admin", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  otherAccountId = (await prisma.account.create({ data: { ownerUserId: other.id, name: "Other wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } })).id;
  categoryAccountId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } })).id;
  expenseAccountId = (await prisma.account.create({ data: { ownerUserId: userId, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } })).id;
});

afterAll(async () => {
  await prisma.transaction.deleteMany({ where: { ownerUserId: userId } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.token as string;
}

describe("F-09 opening-balance management", () => {
  it("TEST-42 records a wallet opening balance and date persistently", async () => {
    const wallet = await prisma.account.create({ data: { ownerUserId: userId, name: "Wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "1.005", date: "2026-11-01" }).expect(400);
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "750.00", date: "2026-11-01" }).expect(200);
    const account = await prisma.account.findUniqueOrThrow({ where: { id: wallet.id } });
    expect(account.openingBalance.toString()).toBe("750");
    expect(account.openingBalanceDate?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect((await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200)).body.accounts).toContainEqual({ accountId: wallet.id, balance: "750" });
  });

  it("TEST-43 signs opening balances for loan accounts and includes their outstanding totals", async () => {
    const given = await prisma.account.create({ data: { ownerUserId: userId, name: "Loan given", type: AccountType.LOAN_GIVEN, subtype: AccountSubtype.OTHER } });
    const taken = await prisma.account.create({ data: { ownerUserId: userId, name: "Loan taken", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.OTHER } });
    const token = await login(emails.user);
    await request(app).post(`/api/accounts/${given.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "300", date: "2026-11-01" }).expect(200);
    await request(app).post(`/api/accounts/${taken.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "1000", date: "2026-11-01" }).expect(200);
    const givenSaved = await prisma.account.findUniqueOrThrow({ where: { id: given.id } });
    const takenSaved = await prisma.account.findUniqueOrThrow({ where: { id: taken.id } });
    expect(givenSaved.openingBalance.toString()).toBe("300");
    expect(takenSaved.openingBalance.toString()).toBe("-1000");
    expect((await request(app).get("/api/summaries").set("Authorization", `Bearer ${token}`).expect(200)).body).toMatchObject({ loansGivenOutstanding: "300", loansTakenOutstanding: "1000" });
  });

  it("TEST-44 permits a corrected Cash opening balance at zero and rejects an overdraft", async () => {
    const bank = await prisma.account.create({ data: { ownerUserId: userId, name: "Balance test bank", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "1000" } });
    const token = await login(emails.user);
    await request(app).post("/api/transactions/payment").set("Authorization", `Bearer ${token}`).send({ totalAmount: "400", date: "2026-11-01", sourceAccountId: bank.id, allocations: [{ accountId: expenseAccountId, allocationType: "EXPENSE", amount: "400" }] }).expect(201);
    await request(app).post(`/api/accounts/${bank.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "400", date: "2026-11-01" }).expect(200);
    await request(app).post(`/api/accounts/${bank.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send({ amount: "399.99", date: "2026-11-02" }).expect(400, { error: "This change would make a cash account balance negative." });
    const saved = await prisma.account.findUniqueOrThrow({ where: { id: bank.id } });
    expect(saved.openingBalance.toString()).toBe("400");
    expect((await request(app).get("/api/summaries/balances").set("Authorization", `Bearer ${token}`).expect(200)).body.accounts).toContainEqual({ accountId: bank.id, balance: "0" });
  });

  it("TEST-45 rejects category and archived-account opening balances", async () => {
    const wallet = await prisma.account.create({ data: { ownerUserId: userId, name: "Archived wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const token = await login(emails.user);
    const body = { amount: "10", date: "2026-11-01" };
    await request(app).post(`/api/accounts/${categoryAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`).send(body).expect(400, { error: "Opening balances can only be recorded for cash and loan accounts." });
    await request(app).post(`/api/accounts/${expenseAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`).send(body).expect(400, { error: "Opening balances can only be recorded for cash and loan accounts." });
    await request(app).post(`/api/accounts/${wallet.id}/archive`).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send(body).expect(400, { error: "This account is archived." });
    const unchanged = await prisma.account.findUniqueOrThrow({ where: { id: wallet.id } });
    expect(unchanged.openingBalance.isZero()).toBe(true);
    expect(unchanged.openingBalanceDate).toBeNull();
  });

  it("TEST-46 enforces ownership, role and authentication", async () => {
    const wallet = await prisma.account.create({ data: { ownerUserId: userId, name: "Private wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const token = await login(emails.user);
    const adminToken = await login(emails.admin);
    const body = { amount: "10", date: "2026-11-01" };
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).set("Authorization", `Bearer ${token}`).send(body).expect(200);
    await request(app).post(`/api/accounts/${otherAccountId}/opening-balance`).set("Authorization", `Bearer ${token}`).send(body).expect(403);
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).set("Authorization", `Bearer ${adminToken}`).send(body).expect(403);
    await request(app).post(`/api/accounts/${wallet.id}/opening-balance`).send(body).expect(401);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: wallet.id } })).openingBalance.toString()).toBe("10");
  });
});
