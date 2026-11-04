# F-05 Payment/Charge with Split Allocation

## Purpose and scope

Allow an authenticated `USER` to record a credit-card purchase split across the user's expense accounts, especially Dining and Groceries.

## API and persistence

- `POST /api/transactions/payment` records a payment or charge.
- The source account must be the authenticated user's credit-card account.
- The transaction stores the total amount, transaction date, source account, and expense allocation lines.
- Allocation lines must total exactly the transaction amount and are persisted with the transaction.
- `GET /api/transactions` and `GET /api/transactions/:transactionId` return the saved purchase.
- Balance calculations include outgoing source transactions, so credit-card debt increases by the purchase total.

## Validation and access

- Reject missing, zero, negative, malformed, non-finite, or over-precision amounts.
- Reject invalid dates, source accounts, non-credit-card source accounts, invalid expense accounts, and mismatched allocation totals.
- Require an authenticated, enabled `USER` session.
- Derive ownership from the authenticated session and reject another user's accounts.
- Invalid requests must not create a transaction or allocation rows.

## UI

The authenticated user can select a credit card, enter the purchase date and total, enter Dining and Grocery allocation amounts, submit the split purchase, and see the updated expense summary, credit-card balance, and transaction history.

## Acceptance criteria

| AC | Verification |
|---|---|
| AC-23 | An authenticated user can record a credit-card purchase. |
| AC-24 | A purchase can contain Dining and Grocery allocation lines. |
| AC-25 | Allocation lines must equal the transaction total. |
| AC-26 | A mismatched allocation total is rejected without a stored transaction. |
| AC-27 | Credit-card debt increases by the purchase total. |
| AC-28 | Dining and Grocery expense totals update correctly. |
| AC-29 | The purchase appears in transaction history. |

## Definition of Done

The payment form, API, persistence, balance calculation, expense summary, ownership checks, rollback behavior, and automated server/client tests are complete and the teammate reviews the pull request.
