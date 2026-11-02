import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";
import { createTestUsers, deleteTestUsers, testEmails, testPassword } from "./helpers.js";

const prisma = getPrisma();

beforeAll(async () => { await createTestUsers(prisma); });
afterAll(async () => { await deleteTestUsers(prisma); await prisma.$disconnect(); });

describe("F-01 authentication and role access", () => {
  it("creates a bearer session for valid credentials and returns safe identity", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(Date.parse(response.body.expiresAt)).toBeGreaterThan(Date.now());
    expect(response.body.user).toMatchObject({ email: testEmails.userA, role: "USER" });
    expect(response.body.user.passwordHash).toBeUndefined();
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${response.body.token}`).expect(200, { user: response.body.user });
  });

  it("rejects invalid credentials without disclosing whether the user exists", async () => {
    const wrongPassword = await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: "wrong" }).expect(401);
    const unknownUser = await request(app).post("/api/auth/login").send({ email: "missing@test.local", password: "wrong" }).expect(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });

  it("rejects protected requests without a token and ends a session on logout", async () => {
    await request(app).get("/api/admin/users").expect(401);
    const login = await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(200);
    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${login.body.token}`).expect(204);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`).expect(401);
  });

  it("rejects an expired bearer session", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmails.userA } });
    const token = "expired-session-test-token";
    await prisma.authSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() - 1000) } });
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(401);
  });

  it("allows an administrator to disable a user and blocks that user's existing session", async () => {
    const adminLogin = await request(app).post("/api/auth/login").send({ email: testEmails.admin, password: testPassword }).expect(200);
    const userLogin = await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(200);
    await request(app).patch(`/api/admin/users/${userLogin.body.user.id}/status`).set("Authorization", `Bearer ${adminLogin.body.token}`).send({ enabled: false }).expect(200);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${userLogin.body.token}`).expect(401);
    await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(401);
    await request(app).patch(`/api/admin/users/${userLogin.body.user.id}/status`).set("Authorization", `Bearer ${adminLogin.body.token}`).send({ enabled: true }).expect(200);
    await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(200);
    await prisma.user.update({ where: { email: testEmails.userA }, data: { enabled: true } });
  });

  it("rejects user-role access to administrator operations", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: testEmails.userA, password: testPassword }).expect(200);
    await request(app).get("/api/admin/users").set("Authorization", `Bearer ${login.body.token}`).expect(403);
  });
});
