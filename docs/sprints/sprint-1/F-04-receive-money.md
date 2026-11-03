# F-04 Receive Money

## Purpose and scope

Allow an authenticated `USER` to record salary or other income received into their own cash or bank account. F-04 persists the receive-money transaction and its income allocation line, then exposes the resulting bank balance and income summary.

F-04 does not add credit-card purchases, repayments, transfers, or other transaction forms; those belong to F-05, F-06, or later sprints.

## Transaction and persistence

- `POST /api/transactions/receive` records a receive-money transaction.
- The receiving account must be owned by the authenticated user and be a cash or bank account.
- The transaction stores the total amount, transaction date, receiving account, and one or more allocation lines.
- Salary is allocated to the seeded `INCOME` account for the authenticated user.
- The total of the allocation lines must equal the transaction total.
- The transaction and allocation line are persisted together; invalid input must not create a partial transaction.
- The resulting account balance and income summary are calculated from persisted records and remain available after a fresh read or restart.

## Validation and access

- Accept a finite positive decimal amount.
- Reject missing, zero, negative, non-numeric, or non-finite amounts.
- Accept only a valid transaction date using the project's date validation convention.
- Reject missing or invalid receiving accounts, non-cash receiving accounts, invalid income allocations, and allocation totals that do not equal the transaction total.
- Require an authenticated, enabled `USER` session.
- Derive ownership from the authenticated session; never trust a client-supplied owner or user ID.
- Reject unauthenticated requests, administrator financial access, nonexistent accounts, and accounts owned by another user using the existing API error conventions.

## UI

The authenticated `USER` can open a receive-money form, select their own bank or cash receiving account, enter the amount and date, choose the income allocation, and submit the transaction. The UI displays validation errors near the relevant fields and shows the saved transaction, updated balance, and income summary after success. The administrator UI does not display or request personal financial data.

## Acceptance criteria

| AC | Verification |
|---|---|
| AC-17 | An authenticated user can record salary received into their own bank account. |
| AC-18 | The receiving bank balance increases by the received amount. |
| AC-19 | The income summary increases by the income allocation amount. |
| AC-20 | The receive-money transaction and allocation line are persisted and returned by a fresh read. |
| AC-21 | Invalid amount, date, receiving account, income allocation, and mismatched allocation total are rejected without a partial write. |
| AC-22 | A user cannot record income into another user's account. |

## Tests

- Valid salary transaction persists the transaction and income allocation.
- The receiving bank balance increases correctly.
- The income summary increases correctly.
- The transaction and allocation remain available after a fresh database read or restart.
- Zero, negative, malformed, missing, and non-finite amounts are rejected.
- Invalid or malformed dates are rejected.
- Invalid receiving account types and invalid income allocations are rejected.
- Allocation totals that do not equal the transaction total are rejected without a partial write.
- Unauthenticated, administrator, nonexistent-account, and cross-owner requests are rejected.
- The user UI submits salary and displays the saved transaction, updated balance, and income summary.

## Definition of Done

The receive-money form, API, and database persistence record salary for the authenticated user's own bank or cash account; balances and income summaries are calculated correctly; validation and ownership rules are enforced; invalid requests do not create partial records; required server, persistence, and UI tests pass; and the teammate reviews the F-04 pull request.
