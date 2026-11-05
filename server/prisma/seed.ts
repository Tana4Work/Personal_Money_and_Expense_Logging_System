import { AccountSubtype, AccountType, AllocationType, Prisma, PrismaClient, TransactionFormType, UserRole } from "@prisma/client";
import { hashPassword } from "../src/auth.js";
import { seedAccountsForUser } from "../src/account-seed.js";

const prisma = new PrismaClient();

function requiredSeedPassword(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to a synthetic local password before seeding.`);
  return value;
}

type DemoProfile = { openingBalance: string; salary: string; dining: string; groceries: string; repayment: string };

async function seedDemoJourney(ownerUserId: number, profile: DemoProfile): Promise<void> {
  const existingTransactions = await prisma.transaction.count({ where: { ownerUserId } });

  const accounts = await prisma.account.findMany({ where: { ownerUserId } });
  const bank = accounts.find((account) => account.name === "Bank Account" && account.type === AccountType.CASH && account.subtype === AccountSubtype.BANK);
  const card = accounts.find((account) => account.name === "Credit Card" && account.type === AccountType.LOAN_TAKEN);
  const salary = accounts.find((account) => account.name === "Salary" && account.type === AccountType.INCOME);
  const dining = accounts.find((account) => account.name === "Dining" && account.type === AccountType.EXPENSE);
  const groceries = accounts.find((account) => account.name === "Groceries" && account.type === AccountType.EXPENSE);
  if (!bank || !card || !salary || !dining || !groceries) throw new Error(`Unable to seed demo journey for user ${ownerUserId}: standard accounts are missing.`);

  const date = new Date("2026-11-05T00:00:00.000Z");
  const purchaseTotal = new Prisma.Decimal(profile.dining).add(profile.groceries);
  await prisma.account.update({ where: { id: bank.id }, data: { openingBalance: profile.openingBalance, openingBalanceDate: date } });

  if (existingTransactions === 0) {
    await prisma.transaction.create({ data: { ownerUserId, formType: TransactionFormType.RECEIVE_MONEY, receivingAccountId: bank.id, totalAmount: profile.salary, transactionDate: date, allocations: { create: [{ accountId: salary.id, allocationType: AllocationType.INCOME, amount: profile.salary }] } } });
    await prisma.transaction.create({ data: { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: card.id, totalAmount: purchaseTotal, transactionDate: date, allocations: { create: [{ accountId: dining.id, allocationType: AllocationType.EXPENSE, amount: profile.dining }, { accountId: groceries.id, allocationType: AllocationType.EXPENSE, amount: profile.groceries }] } } });
    await prisma.transaction.create({ data: { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: bank.id, receivingAccountId: card.id, totalAmount: profile.repayment, transactionDate: date, allocations: { create: [{ accountId: card.id, allocationType: AllocationType.REPAYMENT, amount: profile.repayment }] } } });
    return;
  }

  if (existingTransactions !== 3) return;
  const receive = await prisma.transaction.findFirst({ where: { ownerUserId, formType: TransactionFormType.RECEIVE_MONEY, receivingAccountId: bank.id } });
  const purchase = await prisma.transaction.findFirst({ where: { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: card.id, receivingAccountId: null } });
  const repayment = await prisma.transaction.findFirst({ where: { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: bank.id, receivingAccountId: card.id } });
  if (!receive || !purchase || !repayment) return;
  await prisma.transaction.update({ where: { id: receive.id }, data: { totalAmount: profile.salary } });
  await prisma.allocationLine.updateMany({ where: { transactionId: receive.id, accountId: salary.id, allocationType: AllocationType.INCOME }, data: { amount: profile.salary } });
  await prisma.transaction.update({ where: { id: purchase.id }, data: { totalAmount: purchaseTotal } });
  await prisma.allocationLine.updateMany({ where: { transactionId: purchase.id, accountId: dining.id, allocationType: AllocationType.EXPENSE }, data: { amount: profile.dining } });
  await prisma.allocationLine.updateMany({ where: { transactionId: purchase.id, accountId: groceries.id, allocationType: AllocationType.EXPENSE }, data: { amount: profile.groceries } });
  await prisma.transaction.update({ where: { id: repayment.id }, data: { totalAmount: profile.repayment } });
  await prisma.allocationLine.updateMany({ where: { transactionId: repayment.id, accountId: card.id, allocationType: AllocationType.REPAYMENT }, data: { amount: profile.repayment } });
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
    await seedDemoJourney(user.id, profiles[index]);
  }
  const existingAdmin = await prisma.user.findUnique({ where: { email: "system.admin@money.local" } }) ?? await prisma.user.findUnique({ where: { email: "demo.admin@money.local" } });
  if (existingAdmin) {
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { name: "System Administrator", email: "system.admin@money.local", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash } });
  } else {
    await prisma.user.create({ data: { name: "System Administrator", email: "system.admin@money.local", role: UserRole.ADMINISTRATOR, enabled: true, passwordHash: adminPasswordHash } });
  }

}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
