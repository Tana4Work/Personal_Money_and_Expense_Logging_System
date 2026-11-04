# F-06 Credit-card Repayment and Financial Overview

## Purpose and scope

Allow an authenticated `USER` to repay credit-card debt from their own bank account and view the complete Sprint 1 financial overview.

## API and persistence

- `POST /api/transactions/repayment` records a repayment.
- The source account must be the authenticated user's bank account.
- The destination must be the authenticated user's credit-card account.
- The repayment is persisted as a transaction with a `REPAYMENT` allocation.
- Account balances use the source and receiving account fields so bank balance decreases and card debt decreases.
- Repayments are excluded from income and expense summaries.

## Validation and access

- Reject missing, zero, negative, malformed, non-finite, or over-precision amounts.
- Reject invalid dates, non-bank source accounts, non-credit-card destinations, nonexistent accounts, and accounts owned by another user.
- Require an authenticated, enabled `USER` session.
- Derive ownership from the authenticated session.

## UI and overview

The authenticated user can select a bank source, select a credit-card destination, enter the repayment amount and date, submit the repayment, and see updated bank balance, credit-card debt, income, expenses, and transaction history.

## Acceptance criteria

| AC | Verification |
|---|---|
| AC-30 | A user can repay credit-card debt from their bank account. |
| AC-31 | Repayment decreases credit-card debt correctly. |
| AC-32 | Repayment decreases the bank balance correctly. |
| AC-33 | Repayment is excluded from income and expense summaries. |
| AC-34 | The overview shows bank balance, card debt, income, expenses, and history. |
| AC-35 | The complete Sprint 1 journey is persisted and retrievable. |
| AC-36 | Repayment cannot use another user's account. |

## Definition of Done

The repayment form, API, persistence, calculations, overview, ownership rules, complete journey test, and UI/API tests pass, and the teammate reviews the pull request.
