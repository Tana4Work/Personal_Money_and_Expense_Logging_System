# System-Level Software Design Specification — Lab 7 Amendment

This file records the Lab 7 design amendment. The project scope, data model, API plan, and role/ownership matrix remain documented in [PROJECT_PLAN.md](../PROJECT_PLAN.md).

## BR-12 repayment enforcement

- Enforce BR-12 in the server-side `POST /api/transactions/repayment` flow. Do not use a client-side balance pre-check as enforcement.
- Preserve the existing validation order: authentication, amount, date, account ownership, and account types; perform the balance check after these checks.
- Calculate the current all-time source Cash account balance using the same calculation as `/api/summaries/balances`.
- Run the balance check and repayment writes in one Prisma database transaction. Lock the source `Account` row first with `SELECT ... FOR UPDATE` so competing repayments cannot both pass using the same balance.
- Reject a resulting balance below 0.00 with HTTP 400 `{ "error": "Insufficient bank balance for this repayment." }`; return no balance figure and write no transaction or allocation rows. Allow a resulting balance of exactly 0.00.
- Keep existing unauthenticated, Administrator, and cross-owner responses unchanged. Continue to allow repayment above the card debt.

This is a design contract for Issue #63; implementation and runtime verification belong to Issue #64.
