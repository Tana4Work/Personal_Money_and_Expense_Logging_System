import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, TransactionFormType, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const password = "F08TestPassword123!";
const emails = { userA: "f08.user-a@test.local", userB: "f08.user-b@test.local", admin: "f08.admin@test.local" };
let userAId: number;
let userBId: number;

beforeAll(async () => {
  const existingUsers = await prisma.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
  await prisma.transaction.deleteMany({ where: { ownerUserId: { in: existingUsers.map(({ id }) => id) } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  const passwordHash = await hashPassword(password);
  userAId = (await prisma.user.create({ data: { name: "F08 User A", email: emails.userA, passwordHash, role: UserRole.USER } })).id;
  userBId = (await prisma.user.create({ data: { name: "F08 User B", email: emails.userB, passwordHash, role: UserRole.USER } })).id;
  await prisma.user.create({ data: { name: "F08 Admin", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
});

afterAll(async () => {
  await prisma.transaction.deleteMany({ where: { ownerUserId: { in: [userAId, userBId] } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.token as string;
}

describe("F-08 account management", () => {
  it("TEST-33 creates all five account types with zero balances", async () => {
    const token = await login(emails.userA);
    const accounts = [
      { name: "Cash", type: "CASH", subtype: "BANK" },
      { name: "Lent", type: "LOAN_GIVEN", subtype: "OTHER" },
      { name: "Borrowed", type: "LOAN_TAKEN", subtype: "OTHER" },
      { name: "Interest", type: "INCOME", subtype: "OTHER" },
      { name: "Travel", type: "EXPENSE", subtype: "OTHER" },
    ];
    for (const account of accounts) {
      const response = await request(app).post("/api/accounts").set("Authorization", `Bearer ${token}`).send(account).expect(201);
      expect(response.body).toMatchObject({ ...account, openingBalance: "0", archivedAt: null });
    }
    const listed = await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(200);
    expect(listed.body.map((entry: { name: string }) => entry.name)).toEqual(expect.arrayContaining(accounts.map(({ name }) => name)));
  });

  it("TEST-34 rejects invalid types, subtype pairs, and names without writing", async () => {
    const token = await login(emails.userA);
    const count = await prisma.account.count({ where: { ownerUserId: userAId } });
    for (const body of [
      { name: "Invalid type", type: "SAVINGS", subtype: "OTHER" },
      { name: "Invalid pair", type: "CASH", subtype: "CREDIT_CARD" },
      { name: "   ", type: "CASH", subtype: "BANK" },
      { name: "x".repeat(61), type: "CASH", subtype: "BANK" },
    ]) await request(app).post("/api/accounts").set("Authorization", `Bearer ${token}`).send(body).expect(400);
    expect(await prisma.account.count({ where: { ownerUserId: userAId } })).toBe(count);
  });

  it("TEST-35 enforces case-insensitive names per owner", async () => {
    const tokenA = await login(emails.userA);
    const tokenB = await login(emails.userB);
    const body = { name: "Vacation", type: "CASH", subtype: "WALLET" };
    await request(app).post("/api/accounts").set("Authorization", `Bearer ${tokenA}`).send(body).expect(201);
    await request(app).post("/api/accounts").set("Authorization", `Bearer ${tokenA}`).send({ ...body, name: "vacation" }).expect(409);
    await request(app).post("/api/accounts").set("Authorization", `Bearer ${tokenB}`).send(body).expect(201);
  });

  it("TEST-36 renames an account but rejects type or subtype changes", async () => {
    const account = await prisma.account.create({ data: { ownerUserId: userAId, name: "Old wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const token = await login(emails.userA);
    await request(app).patch(`/api/accounts/${account.id}`).set("Authorization", `Bearer ${token}`).send({ name: "New wallet" }).expect(200);
    await request(app).patch(`/api/accounts/${account.id}`).set("Authorization", `Bearer ${token}`).send({ type: "EXPENSE" }).expect(400);
    await request(app).patch(`/api/accounts/${account.id}`).set("Authorization", `Bearer ${token}`).send({ subtype: "BANK" }).expect(400);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).type).toBe(AccountType.CASH);
  });

  it("TEST-37 archives, filters, restores, and prevents use of archived accounts", async () => {
    const account = await prisma.account.create({ data: { ownerUserId: userAId, name: "Archive wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const token = await login(emails.userA);
    const archived = await request(app).post(`/api/accounts/${account.id}/archive`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(archived.body.archivedAt).toEqual(expect.any(String));
    const normalList = await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(200);
    expect(normalList.body.some((entry: { id: number }) => entry.id === account.id)).toBe(false);
    const completeList = await request(app).get("/api/accounts?includeArchived=true").set("Authorization", `Bearer ${token}`).expect(200);
    expect(completeList.body.some((entry: { id: number }) => entry.id === account.id)).toBe(true);
    const salary = await prisma.account.create({ data: { ownerUserId: userAId, name: "F08 salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } });
    await request(app).post("/api/transactions/receive").set("Authorization", `Bearer ${token}`).send({ totalAmount: "5", date: "2026-11-25", receivingAccountId: account.id, allocations: [{ accountId: salary.id, allocationType: "INCOME", amount: "5" }] }).expect(400, { error: "This account is archived." });
    const restored = await request(app).post(`/api/accounts/${account.id}/restore`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(restored.body.archivedAt).toBeNull();
  });

  it("TEST-38 rejects archiving a nonzero balance account", async () => {
    const account = await prisma.account.create({ data: { ownerUserId: userAId, name: "Nonzero bank", type: AccountType.CASH, subtype: AccountSubtype.BANK, openingBalance: "500" } });
    const token = await login(emails.userA);
    await request(app).post(`/api/accounts/${account.id}/archive`).set("Authorization", `Bearer ${token}`).expect(409, { error: "Only an account with a zero balance can be archived." });
    const unchanged = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(unchanged.openingBalance.toString()).toBe("500");
  });

  it("TEST-39 deletes unused accounts and retains accounts referenced by transactions", async () => {
    const unused = await prisma.account.create({ data: { ownerUserId: userAId, name: "Unused expense", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } });
    const used = await prisma.account.create({ data: { ownerUserId: userAId, name: "Used bank", type: AccountType.CASH, subtype: AccountSubtype.BANK } });
    await prisma.transaction.create({ data: { ownerUserId: userAId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: used.id, totalAmount: "1", transactionDate: new Date("2026-11-25T00:00:00Z") } });
    const token = await login(emails.userA);
    await request(app).delete(`/api/accounts/${unused.id}`).set("Authorization", `Bearer ${token}`).expect(204);
    await request(app).delete(`/api/accounts/${used.id}`).set("Authorization", `Bearer ${token}`).expect(409, { error: "This account has transactions. Archive it instead." });
    expect(await prisma.account.findUnique({ where: { id: used.id } })).not.toBeNull();
  });

  it("TEST-40 enforces authentication, USER role, and account ownership", async () => {
    const account = await prisma.account.create({ data: { ownerUserId: userAId, name: "Private wallet", type: AccountType.CASH, subtype: AccountSubtype.WALLET } });
    const tokenB = await login(emails.userB);
    const adminToken = await login(emails.admin);
    const foreignCalls = [
      () => request(app).get(`/api/accounts/${account.id}`),
      () => request(app).patch(`/api/accounts/${account.id}`).send({ name: "Changed" }),
      () => request(app).post(`/api/accounts/${account.id}/archive`),
      () => request(app).post(`/api/accounts/${account.id}/restore`),
      () => request(app).delete(`/api/accounts/${account.id}`),
    ];
    for (const call of foreignCalls) await call().set("Authorization", `Bearer ${tokenB}`).expect(403);
    const adminCalls = [
      () => request(app).get("/api/accounts"),
      () => request(app).post("/api/accounts").send({ name: "Admin wallet", type: "CASH", subtype: "WALLET" }),
      ...foreignCalls,
    ];
    for (const call of adminCalls) await call().set("Authorization", `Bearer ${adminToken}`).expect(403);
    const anonymousCalls = [
      () => request(app).get("/api/accounts"),
      () => request(app).post("/api/accounts").send({ name: "Anon wallet", type: "CASH", subtype: "WALLET" }),
      ...foreignCalls,
    ];
    for (const call of anonymousCalls) await call().expect(401);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).name).toBe("Private wallet");
  });
});
