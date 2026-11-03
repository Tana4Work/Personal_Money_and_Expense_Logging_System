# F-03 Opening Balance

## Purpose and scope

Allow an authenticated `USER` to establish the opening balance and its as-of date for their own bank account. Store this as account opening-balance data; it is not income, expense, or a transaction.

## API and persistence

- `POST /api/accounts/:accountId/opening-balance`
- JSON body: `{ "amount": "0.00", "date": "YYYY-MM-DD" }`.
- The account must be owned by the authenticated user and have type `CASH` and subtype `BANK`.
- Persist the amount in `Account.openingBalance` and the calendar date in `Account.openingBalanceDate`.
- A repeat request replaces the saved amount and date.
- Return the updated account using the existing account response fields, including the opening-balance date.
- Reject unauthenticated requests, administrators, invalid IDs, missing accounts, accounts owned by another user, and non-bank account types with the API's existing error response conventions.

## Validation rules

- Accept finite decimal amounts greater than or equal to zero; zero is valid.
- Reject negative, non-numeric, non-finite, missing, or malformed amounts.
- Accept only a real calendar date in `YYYY-MM-DD` form. Store that date at UTC midnight so the calendar date remains stable on read.
- No future-date restriction is specified by the approved requirements.

## Acceptance criteria

| AC | Verification |
|---|---|
| AC-12 | An authenticated user can record an opening balance for their own bank account. |
| AC-13 | The opening amount and date are persisted and returned by a fresh read. |
| AC-14 | The amount and date remain available after a fresh database read/re-login/restart. |
| AC-15 | Recording an opening balance creates no income or expense transaction. |
| AC-16 | Negative/invalid amounts, invalid dates, and invalid account types are rejected. |

## Tests

- Valid positive and zero amounts persist with the requested date.
- Negative, malformed, missing, and non-finite amounts are rejected.
- Invalid and impossible calendar dates are rejected.
- Repeated submissions replace both stored values.
- Unauthenticated, administrator, cross-owner, nonexistent account, and non-bank account requests are rejected.
- The saved opening balance remains separate from income and expense records.
- The user UI submits the amount/date and displays the saved balance/date.

## Definition of Done

The form, API, and database persist the approved bank opening amount and date; ownership and validation rules are enforced; the opening balance is excluded from income and expense; required server and UI tests pass; and the teammate reviews the F-03 pull request.
