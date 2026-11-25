# F-13 Transaction Corrections

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 04, branch `SP2-04-F13-transaction-corrections`.
**Shared rules:** [Sprint 2 README](README.md) §2–§7. Depends on Issues 01 (shared rule, `updatedAt`, `note`) and 03 (all line types).

## Purpose and scope

An authenticated `USER` can correct a mistake in one of their own transactions by editing it or deleting it. Every balance and summary then reflects the corrected data. Balances are always computed from transactions (README §3), so no stored total needs repair. The design is edit in place plus delete (D-6).

Out of scope: an audit log of earlier values, undo, and bulk edits.

## Workflow

1. In **History**, the user opens a transaction and selects **Edit**. The form is pre-filled with the saved values.
2. The user changes the amount, date, accounts, lines or note, then saves.
3. The server re-runs every validation that creation runs, plus BR-12 on every Cash account affected before or after the change. Then it replaces the transaction in one database transaction.
4. **Delete** asks for confirmation in the UI. The server removes the transaction and its lines, provided no Cash account would go below 0.00.

## Business rules

- The form type cannot change. A payment stays a payment and a receipt stays a receipt. To change the type, delete the transaction and create a new one.
- An edit sends the **complete** new transaction (`PUT`-like semantics on `PATCH`). Partial line updates are not supported.
- **BR-12 (D-6):** after an edit or delete, every `CASH` account referenced by the old **or** the new version must have a balance ≥ 0.00. This catches, for example, deleting a salary receipt that later spending depended on. Error 400 `"This change would make a cash account balance negative."`
- **BR-14** (F-10) is re-checked for a receive-form `REPAYMENT` line on a loan given.
- **Archived accounts:** an edit may keep a reference to an archived account that the original already used. Adding a new reference to an archived account returns 400. A delete is always allowed, subject to BR-12.
- A transaction created by `POST /api/transactions/repayment` or `/transfer` is edited through this same endpoint, using its payment-form shape with one `REPAYMENT` or `TRANSFER` line.
- `updatedAt` is set by the database. `createdAt` never changes.

## API

| Method and path | Request | Success | Errors |
|---|---|---|---|
| `PATCH /api/transactions/:transactionId` | The full creation body for the transaction's form: `{ totalAmount, date, sourceAccountId \| receivingAccountId, allocations[], note? }` | 200 updated transaction with a new `updatedAt` | See below |
| `DELETE /api/transactions/:transactionId` | — | 204 | 400 BR-12, 403, 404 |

Errors on `PATCH`:

| Case | Status and message |
|---|---|
| Any creation validation fails | 400, same message as creation |
| Form type change (e.g. `receivingAccountId` sent on a payment) | 400 `"The transaction form type cannot be changed."` |
| BR-12 | 400 `"This change would make a cash account balance negative."` |
| BR-14 | 400 `"The repayment is more than the amount owed on this loan."` |
| Another user's transaction | 403 `"Transaction access is not allowed."` (as Sprint 1 GET) |
| Missing transaction | 404 |
| Access | 401 with no session; 403 for an Administrator |

Implementation, in one `prisma.$transaction`:

1. Load the old transaction and check ownership.
2. Validate the new body.
3. Lock all old and new `CASH` and affected `LOAN_GIVEN` rows, in ascending ID order.
4. Delete the old lines, update the transaction, and create the new lines.
5. Run `assertCashBalancesNotNegative()` and the BR-14 check.
6. On failure, roll back so the original stays exactly as it was.

## Data

No schema change beyond README §6 (`updatedAt`). `AllocationLine` already has `onDelete: Cascade`, so deleting a transaction removes its lines.

## UI (implemented in Issue 06)

- Each row in **History** has Edit and Delete buttons.
- Edit opens the matching form (payment, receive, transfer or repayment) pre-filled with the saved values.
- Delete asks "Delete this transaction? Balances will be recalculated."
- Both actions show the server's rejection message and leave the row unchanged on failure.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-75 | Editing a payment's amount and lines persists. A re-fetch shows the new values, a later `updatedAt`, and the same `createdAt`. Balances and summaries reflect the new values. |
| AC-76 | Changing a payment's source account moves the effect, from the old account to the new one. |
| AC-77 | Deleting a transaction returns 204, removes it and its lines, and restores the affected balances. |
| AC-78 | An edit or delete that would leave a Cash account below 0.00 (for example, deleting the receipt that funded later spending) returns 400. The transaction and all balances are unchanged. |
| AC-79 | An edit with a mismatched allocation total, a disallowed line type, a form-type change or a new archived account returns 400 with nothing changed. |
| AC-80 | An edit that leaves a Cash account at exactly 0.00 succeeds. |
| AC-81 | Another user's transaction returns 403 on PATCH and DELETE, an Administrator gets 403, and no session gets 401, with nothing changed. |
| AC-82 | Sprint 1 transactions, including repayments, can be edited and deleted, and their balances stay correct under D-10. |
| AC-82-UI | Edit and Delete in History update the list and show server rejections. Verified in Issue 06. |

## Test specification

File `server/tests/f13-transaction-corrections.api.test.ts`. Setup: user A has a bank with a 1,000.00 opening balance, a wallet, a card, Dining, Groceries and Salary. User B has their own data.

| Test | Level | AC | Input | Expected result |
|---|---|---|---|---|
| TEST-69 | API/DB | AC-75 | A bank payment of 200.00 to Dining. PATCH it to 300.00, split 100.00 Dining and 200.00 Groceries, with the note "fixed". | 200. A re-fetch shows the new values, the note, `updatedAt` > `createdAt`, and the same `createdAt`. Bank 700.00. Expenses 300. |
| TEST-70 | API/DB | AC-76 | Wallet 500.00 (opening balance). PATCH the TEST-69 payment's source from the bank to the wallet. | 200. Bank 1,000.00, wallet 200.00. |
| TEST-71 | API/DB | AC-77 | DELETE the payment. | 204. GET → 404. The allocation lines are gone. Balances are back to the opening values. |
| TEST-72 | API/DB | AC-78 | Bank 0.00. Receive salary 1,000.00, then pay 800.00 from the bank. DELETE the salary receipt. Then PATCH the payment to 1,000.01. | Both → 400 with the D-6 message. The salary still exists, the payment is unchanged, and the bank is 200.00. |
| TEST-73 | API/DB | AC-79 | PATCH with (a) lines totalling less than the total, (b) an `INCOME` line on a payment, (c) `receivingAccountId` on a payment, (d) a newly archived account. | All return 400. The transaction is byte-identical on re-fetch. |
| TEST-74 | API/DB | AC-80 | Bank 500.00 and a payment of 100.00. PATCH it to 500.00. | 200. Bank 0.00. |
| TEST-75 | API/DB | AC-81 | B sends PATCH and DELETE on A's transaction. An Administrator sends both. No token. | 403, 403, 403, 403 and 401. A's transaction is unchanged. |
| TEST-76 | API/DB | AC-82 | Run the Sprint 1 journey (opening balance → salary → split card purchase → repayment). PATCH the repayment to 1,500.00, then DELETE the card purchase. | 200, then 204. Card and bank balances equal recomputed values and are not double-counted. |
| TEST-77 | API/DB (concurrent) | AC-78 | Bank opening 600.00 and a 100.00 bank payment, so the bank is 500.00. At once, with `Promise.all`: PATCH that payment to 400.00 (needs 300.00 more), and a new 300.00 transfer from the bank. | One succeeds and one returns 400. The bank ends at 200.00 and never goes below 0.00. |

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature). TEST-69 to TEST-77 pass, with RED output showing TEST-72 and TEST-77 failing before the BR-12 checks are wired in.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract (D-6). | #73 |
