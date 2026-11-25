# F-12 Transfers and the Shared Cash-outflow Rule

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 01, branch `SP2-01-br12-shared-check-transfers`. This branch is the first Sprint 2 code, and Issues 02–04 build on it.
**Shared rules:** [Sprint 2 README](README.md) §2–§7.

## Purpose and scope

This issue delivers two things:

1. **Transfers.** An authenticated `USER` can move money between their own Cash accounts, for example from the bank to the wallet.
2. **Shared foundation** that every later Sprint 2 feature relies on:
   - the balance calculation rule D-10 (README §3);
   - BR-12 extracted into one helper and applied to every Cash outflow (README §4);
   - the payment form accepting a `CASH` source with `EXPENSE` lines;
   - the shared 2-decimal amount rule and the optional `note` (README §5);
   - the `note` and `updatedAt` migration (README §6).

## Workflow

1. On **Record → Transfer**, the user picks a *from* and a *to* Cash account and enters an amount, a date and an optional note.
2. The server stores a `PAYMENT_OR_CHARGE` transaction with source = *from* and one `TRANSFER` line to *to*.
3. The *from* balance falls (BR-12) and the *to* balance rises by the same amount. The transfer counts as neither income nor expense.

A transfer can also appear as a line inside a mixed payment-form transaction, or as a receive-form `TRANSFER` line taken from another Cash account (README §2). The dedicated endpoint is the simple case.

## Business rules

- Both accounts are owned, non-archived `CASH` accounts and must be different.
- **BR-12** applies to the *from* account, and to the Cash account behind any receive-form `TRANSFER` line.
- Total money is conserved: the sum of all Cash balances is unchanged by a transfer.

## API

| Method and path | Request | Success | Errors |
|---|---|---|---|
| `POST /api/transactions/transfer` (new) | `{ "totalAmount": "250.00", "date": "2026-11-26", "sourceAccountId": <bank>, "receivingAccountId": <wallet>, "note": "ATM" }` | 201 transaction (`formType` `PAYMENT_OR_CHARGE`, one `TRANSFER` line) | See below |
| `POST /api/transactions/payment` | A `CASH` source is now accepted, with `EXPENSE` and/or `TRANSFER` lines | 201 | 400 BR-12 |
| `POST /api/transactions/receive` | `TRANSFER` lines from another `CASH` account are now accepted | 201 | 400 BR-12 on the source Cash account |

Errors on the transfer endpoint:

| Case | Status and message |
|---|---|
| Same account | 400 `"Transfer accounts must be different."` |
| Either account is not Cash | 400 `"Transfers must use cash accounts."` |
| Archived account | 400 `"This account is archived."` |
| Over the balance | 400 `"Insufficient balance in the source cash account."` |
| Access | 403 for another user's account or an Administrator; 401 with no session; 404 for a missing account |

## Design: shared helper (refactor of the Lab 7 code)

- `assertCashBalancesNotNegative(tx, ownerUserId, cashAccountIds)` runs inside `prisma.$transaction`:
  1. Lock the given `CASH` rows (`SELECT ... FOR UPDATE`, ascending IDs).
  2. Let the caller write.
  3. Recompute the balances with the D-10 calculation.
  4. Throw a typed `CashOverdraftError` if any is below 0.00. The route maps it to the right 400 message, and the transaction rolls back.
- The repayment route is moved onto the helper with no change in behavior (TEST-28 to TEST-32).
- `calculateAccountBalances()` changes to the D-10 formula. Sprint 1 figures stay identical (TEST-10 and the f06 journey).
- `parsePositiveAmount()` allows at most 2 decimal places. Opening balance reuses the same check, with 0 allowed.

## Data

Migration `sprint2_transaction_note_updated_at`: `Transaction.note String? @db.VarChar(200)` and `Transaction.updatedAt DateTime @default(now()) @updatedAt`. The transaction response adds `note` and `updatedAt`.

## UI (implemented in Issue 06)

**Record → Transfer** has a from/to form with two Cash account pickers. The *to* list excludes the selected *from* account. The form shows the server's BR-12 message, with no client-side balance pre-check, as in AC-40.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-67 | A transfer of 250.00 from the bank to the wallet lowers the bank by 250.00 and raises the wallet by 250.00. The total Cash is unchanged, income and expenses are unchanged, and it persists in history. |
| AC-68 | A transfer leaving the source at exactly 0.00 succeeds. 0.01 more returns 400 with no write and no balance figure in the body. |
| AC-69 | Two concurrent transfers whose total exceeds the source balance result in at most one being stored, and the source never goes below 0.00. |
| AC-70 | A transfer to the same account, to a non-Cash account, or to another user's account returns 400, 400 and 403 respectively, with no write. |
| AC-71 | A payment from a bank with `EXPENSE` lines lowers the bank balance (a new Sprint 2 source) and is rejected under BR-12 when it would overdraw. |
| AC-72 | A receive-form `TRANSFER` line taken from a Cash account that lacks the funds returns 400 with no write. |
| AC-73 | Sprint 1 and Lab 7 balance and repayment behavior is unchanged after the refactor. The F-05 and F-06 summary tests retain their income and expense value checks and also verify the additive `loansGivenOutstanding` and `loansTakenOutstanding` fields. TEST-10, the F-06 journey and TEST-28 to TEST-32 pass. An amount with 3 decimal places is rejected with 400. |
| AC-74 | An Administrator gets 403 and no session gets 401 on `/api/transactions/transfer`. |
| AC-74-UI | The transfer form submits a valid transfer and shows the server's BR-12 message. Verified in Issue 06. |

## Test specification

File `server/tests/f12-transfers.api.test.ts`. The regression cases stay in their existing files. Setup: user A has a bank with a 500.00 opening balance and a wallet at 0.00. User B has their own wallet.

| Test | Level | AC | Input | Expected result |
|---|---|---|---|---|
| TEST-60 | API/DB | AC-67 | Transfer 250.00 from the bank to the wallet with the note "ATM", then re-fetch. | 201. Bank 250.00, wallet 250.00. The Cash total is 500.00. `income` and `expenses` are unchanged. `note` is `"ATM"`. |
| TEST-61 | API/DB | AC-68 | Transfer 500.01, then 500.00. | 500.01 → 400 `"Insufficient balance in the source cash account."`, the body has only `error`, and the count is unchanged. 500.00 → 201 and the bank is 0.00. |
| TEST-62 | API/DB | AC-69 | Two transfers of 300.00 sent at once with `Promise.all`. | One 201 and one 400. One transfer stored. The bank is 200.00. |
| TEST-63 | API/DB | AC-70 | From the bank to the bank. From the bank to Dining. From the bank to B's wallet. | 400 `"Transfer accounts must be different."`, 400 `"Transfers must use cash accounts."`, and 403. No writes. |
| TEST-64 | API/DB | AC-71 | Pay 200.00 from the bank to Dining, then pay 300.01 from the bank. | 201 with the bank at 300.00 and expenses up by 200. Then 400 with the BR-12 message and no write. |
| TEST-65 | API/DB | AC-72 | Wallet 0.00. Receive 50.00 into the bank as a `TRANSFER` from the wallet. | 400 with no write. |
| TEST-66 | API/DB | AC-73 | Run the F-04, F-05 and F-06 regression suites. Post a receipt of `"10.005"`; transfer with a 200-character note, then a 201-character note. | All regression tests pass. The 3-decimal amount → 400 `"A valid positive amount is required."`; 200-character note is stored, 201-character note → 400 with no write. |
| TEST-67 | Unit | AC-73 | `calculateAccountBalances()` with synthetic rows: one Sprint 1 repayment (both `receivingAccountId` and a `REPAYMENT` line set), one transfer and one loan given. | The card is credited once, not twice. The transfer target and the loan-given account are credited. The source accounts are debited. |
| TEST-68 | API/DB | AC-74 | An Administrator token, then no token, on the transfer endpoint. | 403, then 401. |

TEST-66 records the Lab 7 defect "amount parser accepts 30 decimal places" as fixed in Issue 01.

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature), plus:

- TEST-60 to TEST-68 pass.
- The RED evidence shows TEST-60 to TEST-65 and TEST-67 failing before the change, and TEST-28 to TEST-32 passing both before and after it.
- The Lab 7 debt item "BR-12 only on repayment" is recorded as resolved in the Part A change register.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0.1 | 2026-11-25 | Clarified AC-73 for additive loan totals in `/api/summaries`; F-05 and F-06 summary regressions retain their income/expense checks and verify the new fields. | #01 |
| 1.0 | 2026-11-25 | First contract. Covers transfers, the D-10 balance rule, BR-12 extended to all Cash outflows, Cash-source payments, 2-decimal amounts and the note. | #73 |
