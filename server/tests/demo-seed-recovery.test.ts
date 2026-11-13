import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountSubtype, AccountType, AllocationType, TransactionFormType, UserRole } from "@prisma/client";
import { hashPassword } from "../src/auth.js";
import { seedAccountsForUser } from "../src/account-seed.js";
import { seedDemoJourney, type DemoProfile } from "../src/demo-seed.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const email = `cloud.seed.recovery.${Date.now()}@test.local`;
const profile: DemoProfile = { openingBalance: "10000", salary: "30000", dining: "800", groceries: "1200", repayment: "2000" };
let ownerUserId = 0;

async function cleanup() {
  if (!ownerUserId) return;
  await prisma.transaction.deleteMany({ where: { ownerUserId } });
  await prisma.account.deleteMany({ where: { ownerUserId } });
  await prisma.user.delete({ where: { id: ownerUserId } });
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Seed Recovery Test", email, passwordHash: await hashPassword("SeedRecovery!1"), role: UserRole.USER },
  });
  ownerUserId = user.id;
  await seedAccountsForUser(prisma, ownerUserId);
  const accounts = await prisma.account.findMany({ where: { ownerUserId } });
  const bank = accounts.find((account) => account.name === "Bank Account" && account.type === AccountType.CASH && account.subtype === AccountSubtype.BANK);
  const card = accounts.find((account) => account.name === "Credit Card");
  const salary = accounts.find((account) => account.name === "Salary");
  const dining = accounts.find((account) => account.name === "Dining");
  if (!bank || !card || !salary || !dining) throw new Error("Seed recovery test accounts were not created.");

  const date = new Date("2026-11-05T00:00:00.000Z");
  await prisma.transaction.create({
    data: {
      ownerUserId, formType: TransactionFormType.RECEIVE_MONEY, receivingAccountId: bank.id,
      totalAmount: profile.salary, transactionDate: date,
      allocations: { create: [{ accountId: salary.id, allocationType: AllocationType.INCOME, amount: profile.salary }] },
    },
  });
  await prisma.transaction.create({
    data: {
      ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: card.id,
      totalAmount: profile.dining, transactionDate: date,
      allocations: { create: [{ accountId: dining.id, allocationType: AllocationType.EXPENSE, amount: profile.dining }] },
    },
  });
});

afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

describe("demo seed recovery", () => {
  it("fills in a partially seeded journey and remains safe to rerun", async () => {
    await seedDemoJourney(prisma, ownerUserId, profile);
    const firstRun = await prisma.transaction.findMany({ where: { ownerUserId }, include: { allocations: true }, orderBy: { id: "asc" } });
    expect(firstRun).toHaveLength(3);
    expect(firstRun.reduce((count, transaction) => count + transaction.allocations.length, 0)).toBe(4);

    await seedDemoJourney(prisma, ownerUserId, profile);
    const secondRun = await prisma.transaction.findMany({ where: { ownerUserId }, include: { allocations: true }, orderBy: { id: "asc" } });
    expect(secondRun.map((transaction) => transaction.id)).toEqual(firstRun.map((transaction) => transaction.id));
    expect(secondRun.reduce((count, transaction) => count + transaction.allocations.length, 0)).toBe(4);
    const purchase = secondRun.find((transaction) => transaction.sourceAccountId !== null && transaction.receivingAccountId === null);
    expect(purchase?.totalAmount.toString()).toBe("2000");
    expect(purchase?.allocations.map((allocation) => allocation.amount.toString()).sort()).toEqual(["1200", "800"]);
  });
});
