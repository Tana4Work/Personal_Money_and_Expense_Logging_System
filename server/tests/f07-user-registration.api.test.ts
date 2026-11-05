import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountType, Prisma, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const email = "f07.new-user@test.local";

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;
  await prisma.account.deleteMany({ where: { ownerUserId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

beforeAll(cleanup);
afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

describe("F-07 user registration", () => {
  it("creates a normal user, standard accounts, and no session", async () => {
    const response = await request(app).post("/api/auth/register").send({ name: "F07 New User", email: ` ${email.toUpperCase()} `, password: "Register!1" }).expect(201);
    expect(response.body.user).toMatchObject({ name: "F07 New User", email, role: "USER" });
    expect(response.body.token).toBeUndefined();
    const user = await prisma.user.findUnique({ where: { email }, include: { accounts: true, sessions: true } });
    expect(user?.role).toBe(UserRole.USER);
    expect(user?.sessions).toHaveLength(0);
    expect(user?.accounts.map((account) => account.name).sort()).toEqual(["Bank Account", "Credit Card", "Dining", "Groceries", "Salary"]);
    expect(user?.accounts.find((account) => account.name === "Credit Card")?.type).toBe(AccountType.LOAN_TAKEN);
    await request(app).post("/api/auth/login").send({ email, password: "Register!1" }).expect(200);
  });

  it("rejects weak passwords, duplicate emails, and administrator role attempts without extra records", async () => {
    const beforeUsers = await prisma.user.count({ where: { email } });
    const beforeAccounts = await prisma.account.count({ where: { owner: { email } } });
    for (const password of ["short!", "lowercase!", "NoSpecial1"]) {
      await request(app).post("/api/auth/register").send({ name: "Invalid", email: "f07.invalid@test.local", password }).expect(400);
    }
    await request(app).post("/api/auth/register").send({ name: "Duplicate", email, password: "Register!1", role: "ADMINISTRATOR" }).expect(409);
    expect(await prisma.user.count({ where: { email } })).toBe(beforeUsers);
    expect(await prisma.account.count({ where: { owner: { email } } })).toBe(beforeAccounts);
  });

  it("rejects missing name/email and does not create a partial user", async () => {
    const before = await prisma.user.count({ where: { email: "f07.missing@test.local" } });
    await request(app).post("/api/auth/register").send({ email: "f07.missing@test.local", password: "Register!1" }).expect(400);
    await request(app).post("/api/auth/register").send({ name: "Missing Email", password: "Register!1" }).expect(400);
    expect(await prisma.user.count({ where: { email: "f07.missing@test.local" } })).toBe(before);
  });
});
