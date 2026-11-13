import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/auth.js";
import { seedAccountsForUser } from "../src/account-seed.js";
import { seedDemoJourney, type DemoProfile } from "../src/demo-seed.js";

const prisma = new PrismaClient();

function requiredSeedPassword(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to a synthetic local password before seeding.`);
  return value;
}

async function main() {
  const userPasswordHash = await hashPassword(requiredSeedPassword("SEED_USER_PASSWORD"));
  const adminPasswordHash = await hashPassword(requiredSeedPassword("SEED_ADMIN_PASSWORD"));
  const demoUsers = [
    { oldEmail: "demo.user@money.local", name: "Anan Chai", email: "anan.chai@money.local" },
    { oldEmail: "demo.user2@money.local", name: "Boonmee Srisuk", email: "boonmee.srisuk@money.local" },
    { oldEmail: "demo.user3@money.local", name: "Narin Wong", email: "narin.wong@money.local" },
    { oldEmail: "demo.user4@money.local", name: "Pimchanok Dee", email: "pimchanok.dee@money.local" },
    { oldEmail: "demo.user5@money.local", name: "Somsak Arun", email: "somsak.arun@money.local" },
  ];
  const profiles: DemoProfile[] = [
    { openingBalance: "10000", salary: "30000", dining: "800", groceries: "1200", repayment: "2000" },
    { openingBalance: "15000", salary: "26000", dining: "1200", groceries: "1800", repayment: "1000" },
    { openingBalance: "8000", salary: "42000", dining: "500", groceries: "700", repayment: "600" },
    { openingBalance: "22000", salary: "18000", dining: "1500", groceries: "500", repayment: "1500" },
    { openingBalance: "12000", salary: "35000", dining: "2500", groceries: "1500", repayment: "4000" },
  ];
  for (const [index, demoUser] of demoUsers.entries()) {
    const existing = await prisma.user.findUnique({ where: { email: demoUser.email } }) ?? await prisma.user.findUnique({ where: { email: demoUser.oldEmail } });
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { name: demoUser.name, email: demoUser.email, role: UserRole.USER, enabled: true, passwordHash: userPasswordHash } })
      : await prisma.user.create({ data: { name: demoUser.name, email: demoUser.email, role: UserRole.USER, enabled: true, passwordHash: userPasswordHash } });
    await seedAccountsForUser(prisma, user.id);
    await seedDemoJourney(prisma, user.id, profiles[index]);
  }
  const existingAdmin = await prisma.user.findUnique({ where: { email: "system.admin@money.local" } }) ?? await prisma.user.findUnique({ where: { email: "demo.admin@money.local" } });
  if (existingAdmin) {
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { name: "System Administrator", email: "system.admin@money.local", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash } });
  } else {
    await prisma.user.create({ data: { name: "System Administrator", email: "system.admin@money.local", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash } });
  }

}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
