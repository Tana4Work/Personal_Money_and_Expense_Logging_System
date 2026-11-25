import { describe, expect, it } from "vitest";
import { AccountType } from "@prisma/client";
import { calculateAccountBalances } from "../src/app.js";

describe("F-12 D-10 balance calculation", () => {
  it("TEST-67 counts allocation balances and ignores payment receivingAccountId", async () => {
    const rows = await calculateAccountBalances({
      account: { findMany: async () => [
        { id: 1, type: AccountType.CASH, openingBalance: "1000" },
        { id: 2, type: AccountType.LOAN_TAKEN, openingBalance: "0" },
        { id: 3, type: AccountType.CASH, openingBalance: "50" },
        { id: 4, type: AccountType.LOAN_GIVEN, openingBalance: "0" },
        { id: 5, type: AccountType.INCOME, openingBalance: "0" },
      ] },
      transaction: { findMany: async () => [
        { formType: "PAYMENT_OR_CHARGE", sourceAccountId: 2, receivingAccountId: 2, totalAmount: "100", allocations: [{ accountId: 5, allocationType: "EXPENSE", amount: "100" }] },
        { formType: "PAYMENT_OR_CHARGE", sourceAccountId: 1, receivingAccountId: 2, totalAmount: "100", allocations: [{ accountId: 2, allocationType: "REPAYMENT", amount: "100" }] },
        { formType: "PAYMENT_OR_CHARGE", sourceAccountId: 1, receivingAccountId: 3, totalAmount: "20", allocations: [{ accountId: 3, allocationType: "TRANSFER", amount: "20" }] },
        { formType: "PAYMENT_OR_CHARGE", sourceAccountId: 1, receivingAccountId: null, totalAmount: "30", allocations: [{ accountId: 4, allocationType: "LOAN_GIVEN", amount: "30" }] },
      ] },
    } as never, 10);

    expect(rows).toEqual([
      { accountId: 1, balance: "850" },
      { accountId: 2, balance: "0" },
      { accountId: 3, balance: "70" },
      { accountId: 4, balance: "30" },
      { accountId: 5, balance: "0" },
    ]);
  });
});
