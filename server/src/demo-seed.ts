import { AccountSubtype, AccountType, AllocationType, Prisma, PrismaClient, TransactionFormType } from "@prisma/client";

export type DemoProfile = { openingBalance: string; salary: string; dining: string; groceries: string; repayment: string };

type SeedPrisma = Pick<PrismaClient, "account" | "transaction" | "allocationLine">;
type SeedTransactionValues = {
  ownerUserId: number;
  formType: TransactionFormType;
  sourceAccountId: number | null;
  receivingAccountId: number | null;
  totalAmount: string | Prisma.Decimal;
  transactionDate: Date;
};
type SeedAllocation = { accountId: number; allocationType: AllocationType; amount: string };

async function ensureSeedTransaction(
  prisma: SeedPrisma,
  where: Prisma.TransactionWhereInput,
  values: SeedTransactionValues,
  allocations: SeedAllocation[],
): Promise<void> {
  const existing = await prisma.transaction.findFirst({ where, select: { id: true } });
  if (!existing) {
    await prisma.transaction.create({ data: { ...values, allocations: { create: allocations } } });
    return;
  }

  await prisma.transaction.update({
    where: { id: existing.id },
    data: { totalAmount: values.totalAmount, transactionDate: values.transactionDate },
  });
  for (const allocation of allocations) {
    const existingAllocation = await prisma.allocationLine.findFirst({
      where: { transactionId: existing.id, accountId: allocation.accountId, allocationType: allocation.allocationType },
      select: { id: true },
    });
    if (existingAllocation) {
      await prisma.allocationLine.update({ where: { id: existingAllocation.id }, data: { amount: allocation.amount } });
    } else {
      await prisma.allocationLine.create({ data: { transactionId: existing.id, ...allocation } });
    }
  }
}

export async function seedDemoJourney(prisma: SeedPrisma, ownerUserId: number, profile: DemoProfile): Promise<void> {
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

  await ensureSeedTransaction(prisma,
    { ownerUserId, formType: TransactionFormType.RECEIVE_MONEY, sourceAccountId: null, receivingAccountId: bank.id },
    { ownerUserId, formType: TransactionFormType.RECEIVE_MONEY, sourceAccountId: null, receivingAccountId: bank.id, totalAmount: profile.salary, transactionDate: date },
    [{ accountId: salary.id, allocationType: AllocationType.INCOME, amount: profile.salary }],
  );
  await ensureSeedTransaction(prisma,
    { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: card.id, receivingAccountId: null },
    { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: card.id, receivingAccountId: null, totalAmount: purchaseTotal, transactionDate: date },
    [
      { accountId: dining.id, allocationType: AllocationType.EXPENSE, amount: profile.dining },
      { accountId: groceries.id, allocationType: AllocationType.EXPENSE, amount: profile.groceries },
    ],
  );
  await ensureSeedTransaction(prisma,
    { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: bank.id, receivingAccountId: card.id },
    { ownerUserId, formType: TransactionFormType.PAYMENT_OR_CHARGE, sourceAccountId: bank.id, receivingAccountId: card.id, totalAmount: profile.repayment, transactionDate: date },
    [{ accountId: card.id, allocationType: AllocationType.REPAYMENT, amount: profile.repayment }],
  );
}
