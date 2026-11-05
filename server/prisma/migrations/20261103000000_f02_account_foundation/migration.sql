CREATE TYPE "AccountType" AS ENUM ('CASH', 'LOAN_GIVEN', 'LOAN_TAKEN', 'INCOME', 'EXPENSE');
CREATE TYPE "AccountSubtype" AS ENUM ('BANK', 'WALLET', 'CREDIT_CARD', 'OTHER');

CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "ownerUserId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subtype" "AccountSubtype" NOT NULL,
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Account_ownerUserId_idx" ON "Account"("ownerUserId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
