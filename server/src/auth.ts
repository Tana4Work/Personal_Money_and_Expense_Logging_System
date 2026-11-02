import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request } from "express";
import type { UserRole } from "@prisma/client";
import { getPrisma } from "./prisma.js";

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type SafeUser = { id: number; name: string; email: string; role: UserRole };

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}

export function safeUser(user: { id: number; name: string; email: string; role: UserRole }): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function readBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(header);
  return match?.[1] ?? null;
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await getPrisma().authSession.create({ data: { tokenHash: tokenHash(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function clearSession(token: string | null): Promise<void> {
  if (!token) return;
  await getPrisma().authSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
}

export async function currentUser(req: Request): Promise<SafeUser | null> {
  const token = readBearerToken(req);
  if (!token) return null;
  const session = await getPrisma().authSession.findFirst({
    where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() }, user: { enabled: true } },
    include: { user: true },
  });
  return session ? safeUser(session.user) : null;
}

export async function endUserSessions(userId: number): Promise<void> {
  await getPrisma().authSession.deleteMany({ where: { userId } });
}
