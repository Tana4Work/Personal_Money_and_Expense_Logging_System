import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, UserRole } from "@prisma/client";
import request from "supertest";
import { seedAccountsForUser } from "../src/account-seed.js";
import { app } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const testPassword = "F02TestPassword123!";
const emails = {
  userA: "f02.user-a@test.local",
  userB: "f02.user-b@test.local",
  admin: "f02.admin@test.local",
  seedUser: "f02.seed-user@test.local",
};

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  const passwordHash = await hashPassword(testPassword);
  await prisma.user.create({ data: { name: "F02 User A", email: emails.userA, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F02 User B", email: emails.userB, passwordHash, role: UserRole.USER } });
  await prisma.user.create({ data: { name: "F02 Administrator", email: emails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  await prisma.user.create({ data: { name: "F02 Seed User", email: emails.seedUser, passwordHash, role: UserRole.USER } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
});

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password: testPassword }).expect(200);
  return response.body.token as string;
}

describe("F-02 account foundation", () => {
  it("seeds the five approved accounts for a user without creating duplicates", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails.seedUser } });
    await seedAccountsForUser(prisma, user.id);
    const seeded = await prisma.account.findMany({ where: { ownerUserId: user.id }, orderBy: { name: "asc" } });
    expect(seeded.map(({ name, type, subtype, openingBalance }) => ({ name, type, subtype, openingBalance: openingBalance.toString() }))).toEqual([
      { name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "0" },
      { name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD", openingBalance: "0" },
      { name: "Dining", type: "EXPENSE", subtype: "OTHER", openingBalance: "0" },
      { name: "Groceries", type: "EXPENSE", subtype: "OTHER", openingBalance: "0" },
      { name: "Salary", type: "INCOME", subtype: "OTHER", openingBalance: "0" },
    ]);

    await seedAccountsForUser(prisma, user.id);
    expect(await prisma.account.count({ where: { ownerUserId: user.id } })).toBe(5);
  });

  it("returns an empty list for an authenticated user without accounts", async () => {
    const token = await login(emails.userB);
    await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(200, []);
  });

  it("rejects unauthenticated and administrator account-list requests", async () => {
    await request(app).get("/api/accounts").expect(401);
    const token = await login(emails.admin);
    await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("returns only the authenticated user's persisted account types and subtypes", async () => {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: emails.userA } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: emails.userB } });
    await prisma.account.create({ data: { ownerUserId: userA.id, name: "Bank Account", type: AccountType.CASH, subtype: AccountSubtype.BANK } });
    await prisma.account.create({ data: { ownerUserId: userB.id, name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER } });

    const token = await login(emails.userA);
    const response = await request(app).get("/api/accounts").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "0" });
    expect(response.body[0]).not.toHaveProperty("ownerUserId");
  });

  it("returns an owned account and rejects another user's account", async () => {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: emails.userA } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: emails.userB } });
    const accountA = await prisma.account.create({ data: { ownerUserId: userA.id, name: "Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD } });
    const accountB = await prisma.account.create({ data: { ownerUserId: userB.id, name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER } });
    const tokenA = await login(emails.userA);

    const ownAccount = await request(app).get(`/api/accounts/${accountA.id}`).set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(ownAccount.body).toMatchObject({ id: accountA.id, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" });
    expect(ownAccount.body).not.toHaveProperty("ownerUserId");

    const otherAccount = await request(app).get(`/api/accounts/${accountB.id}`).set("Authorization", `Bearer ${tokenA}`).expect(403);
    expect(otherAccount.body).not.toHaveProperty("name");
  });

  it("rejects invalid and missing account IDs", async () => {
    const token = await login(emails.userA);
    await request(app).get("/api/accounts/invalid").set("Authorization", `Bearer ${token}`).expect(400);
    await request(app).get("/api/accounts/999999").set("Authorization", `Bearer ${token}`).expect(404);
  });
});
