CREATE TYPE "TransactionFormType" AS ENUM ('PAYMENT_OR_CHARGE', 'RECEIVE_MONEY');
CREATE TYPE "AllocationType" AS ENUM ('INCOME', 'EXPENSE', 'REPAYMENT', 'LOAN_GIVEN', 'BORROWING', 'TRANSFER');

CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "ownerUserId" INTEGER NOT NULL,
    "formType" "TransactionFormType" NOT NULL,
    "sourceAccountId" INTEGER,
    "receivingAccountId" INTEGER,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AllocationLine" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "allocationType" "AllocationType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    CONSTRAINT "AllocationLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Transaction_ownerUserId_transactionDate_idx" ON "Transaction"("ownerUserId", "transactionDate");
CREATE INDEX "Transaction_receivingAccountId_idx" ON "Transaction"("receivingAccountId");
CREATE INDEX "Transaction_sourceAccountId_idx" ON "Transaction"("sourceAccountId");
CREATE INDEX "AllocationLine_transactionId_idx" ON "AllocationLine"("transactionId");
CREATE INDEX "AllocationLine_accountId_idx" ON "AllocationLine"("accountId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receivingAccountId_fkey" FOREIGN KEY ("receivingAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
