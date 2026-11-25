# System-Level Software Design Specification — Lab 7 and Sprint 2 Amendments

This file records the Lab 7 design amendment. The project scope, data model, API plan, and role/ownership matrix remain documented in [PROJECT_PLAN.md](../PROJECT_PLAN.md).

## BR-12 repayment enforcement

- Enforce BR-12 in the server-side `POST /api/transactions/repayment` flow. Do not use a client-side balance pre-check as enforcement.
- Preserve the existing validation order: authentication, amount, date, account ownership, and account types; perform the balance check after these checks.
- Calculate the current all-time source Cash account balance using the same calculation as `/api/summaries/balances`.
- Run the balance check and repayment writes in one Prisma database transaction. Lock the source `Account` row first with `SELECT ... FOR UPDATE` so competing repayments cannot both pass using the same balance.
- Reject a resulting balance below 0.00 with HTTP 400 `{ "error": "Insufficient bank balance for this repayment." }`; return no balance figure and write no transaction or allocation rows. Allow a resulting balance of exactly 0.00.
- Keep existing unauthenticated, Administrator, and cross-owner responses unchanged. Continue to allow repayment above the card debt.

This is a design contract for Issue #63; implementation and runtime verification belong to Issue #64.

## Sprint 2 design amendments (contracts v1.0, Issue #73)

- **Balance calculation D-10:** `calculateAccountBalances()` adds allocation lines on Cash and loan accounts. Payment-form `REPAYMENT`, `LOAN_GIVEN` and `TRANSFER` lines are added. Receive-form `REPAYMENT`, `BORROWING` and `TRANSFER` lines are subtracted. On payment-form transactions, `receivingAccountId` is ignored. Sprint 1 data keeps identical balances. Full rule: [Sprint 2 contracts](sprints/sprint-2/README.md) §3.
- **Shared BR-12 helper:** `assertCashBalancesNotNegative()` runs inside every write that lowers a Cash balance. It locks the affected Cash `Account` rows with `SELECT ... FOR UPDATE` in ascending ID order, recomputes the balances after the write, and rolls back if any is below 0.00. This replaces the repayment-only check.
- **Allocation matrix:** both transaction forms accept the full set of line types from the product definition ([Sprint 2 contracts](sprints/sprint-2/README.md) §2). The server enforces the line-type-to-account-type pairs.
- **Data:** additive migrations `sprint2_transaction_note_updated_at` (`Transaction.note`, `Transaction.updatedAt`) and `sprint2_account_archive` (`Account.archivedAt`).
- **New endpoints:**
  - `POST /api/accounts`
  - `PATCH /api/accounts/:id`
  - `POST /api/accounts/:id/archive`
  - `POST /api/accounts/:id/restore`
  - `DELETE /api/accounts/:id`
  - `POST /api/transactions/transfer`
  - `PATCH /api/transactions/:id`
  - `DELETE /api/transactions/:id`
  - `GET /api/transactions/search`

  Every one requires a `USER` session and derives ownership on the server.
- **Error statuses:** 400 validation or business rule, 401 unauthenticated, 403 role or cross-owner, 404 missing, 409 conflict (duplicate account name, archive with a balance, delete while in use).
