import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { UserRole } from "@prisma/client";
import { clearSession, createSession, currentUser, endUserSessions, hashPassword, passwordIsValid, readBearerToken, safeUser, verifyPassword, type SafeUser } from "./auth.js";
import { getPrisma } from "./prisma.js";

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
}

async function requireAdministrator(req: Request, res: Response): Promise<SafeUser | null> {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return null; }
  if (user.role !== UserRole.ADMINISTRATOR) { res.status(403).json({ error: "Administrator access is required." }); return null; }
  return user;
}

app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "Personal Money API" }));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.enabled || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." }); return;
  }
  const session = await createSession(user.id);
  res.status(200).json({ token: session.token, expiresAt: session.expiresAt.toISOString(), user: safeUser(user) });
}));

app.post("/api/auth/logout", asyncRoute(async (req, res) => {
  await clearSession(readBearerToken(req));
  res.status(204).send();
}));

app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return; }
  res.status(200).json({ user });
}));

app.get("/api/admin/users", asyncRoute(async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const users = await getPrisma().user.findMany({
    select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  res.status(200).json(users);
}));

app.patch("/api/admin/users/:userId/status", asyncRoute(async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0 || typeof req.body?.enabled !== "boolean") {
    res.status(400).json({ error: "A valid user ID and enabled status are required." }); return;
  }
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true } });
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const updated = await getPrisma().user.update({ where: { id: userId }, data: { enabled: req.body.enabled }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true } });
  if (!updated.enabled) await endUserSessions(userId);
  res.status(200).json(updated);
}));

app.use((_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: "Unable to complete the request." });
});
