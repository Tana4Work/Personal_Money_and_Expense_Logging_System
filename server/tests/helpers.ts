import { UserRole, type PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth.js";

export const testPassword = "TestPassword123!";
export const testEmails = {
  userA: "f01.user-a@test.local",
  userB: "f01.user-b@test.local",
  admin: "f01.admin@test.local",
};

export async function createTestUsers(prisma: PrismaClient) {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(testEmails) } } });
  const passwordHash = await hashPassword(testPassword);
  const userA = await prisma.user.create({ data: { name: "Test User A", email: testEmails.userA, passwordHash, role: UserRole.USER } });
  const userB = await prisma.user.create({ data: { name: "Test User B", email: testEmails.userB, passwordHash, role: UserRole.USER } });
  const admin = await prisma.user.create({ data: { name: "Test Administrator", email: testEmails.admin, passwordHash, role: UserRole.ADMINISTRATOR } });
  return { userA, userB, admin };
}

export async function deleteTestUsers(prisma: PrismaClient) {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(testEmails) } } });
}
