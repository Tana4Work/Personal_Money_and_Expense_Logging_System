import { AccountSubtype, AccountType, type PrismaClient } from "@prisma/client";

const initialAccounts = [
  { name: "Bank Account", type: AccountType.CASH, subtype: AccountSubtype.BANK },
  { name: "Credit Card", type: AccountType.LOAN_TAKEN, subtype: AccountSubtype.CREDIT_CARD },
  { name: "Salary", type: AccountType.INCOME, subtype: AccountSubtype.OTHER },
  { name: "Dining", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER },
  { name: "Groceries", type: AccountType.EXPENSE, subtype: AccountSubtype.OTHER },
];

export async function seedAccountsForUser(prisma: Pick<PrismaClient, "account">, ownerUserId: number): Promise<void> {
  for (const account of initialAccounts) {
    const existing = await prisma.account.findFirst({
      where: { ownerUserId, ...account },
      select: { id: true },
    });
    if (!existing) await prisma.account.create({ data: { ownerUserId, ...account } });
  }
}
