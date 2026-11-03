import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/auth.js";
import { seedAccountsForUser } from "../src/account-seed.js";

const prisma = new PrismaClient();

function requiredSeedPassword(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to a synthetic local password before seeding.`);
  return value;
}

async function main() {
  const userPasswordHash = await hashPassword(requiredSeedPassword("SEED_USER_PASSWORD"));
  const adminPasswordHash = await hashPassword(requiredSeedPassword("SEED_ADMIN_PASSWORD"));
  const user = await prisma.user.upsert({
    where: { email: "demo.user@money.local" },
    update: { name: "Demo User", role: UserRole.USER, enabled: true, passwordHash: userPasswordHash },
    create: { name: "Demo User", email: "demo.user@money.local", role: UserRole.USER, enabled: true, passwordHash: userPasswordHash },
  });
  await prisma.user.upsert({
    where: { email: "demo.admin@money.local" },
    update: { name: "Demo Administrator", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash },
    create: { name: "Demo Administrator", email: "demo.admin@money.local", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash },
  });

  await seedAccountsForUser(prisma, user.id);

}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
