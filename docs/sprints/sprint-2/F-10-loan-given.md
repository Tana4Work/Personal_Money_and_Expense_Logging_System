# F-10 Loan Given

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 03, branch `SP2-03-F10-F11-loans`.
**Shared rules:** [Sprint 2 README](README.md) §2–§7. Depends on F-08 (create a `LOAN_GIVEN` account) and on the shared Cash-outflow rule from Issue 01.

## Purpose and scope

An authenticated `USER` can lend money to someone from a Cash account, receive repayments of that loan, and see how much is still owed. Each person the user lends to is a separate `LOAN_GIVEN` account created with F-08, for example "Loan to Somchai".

Out of scope: interest, due dates and reminders. These are excluded from the baseline, which has no external messaging.

## Workflow

1. **Lend.** The user records a payment from a bank or wallet with a `LOAN_GIVEN` line to the loan account. The Cash balance falls, under BR-12, and the loan balance (owed to the user) rises.
2. **Receive a repayment.** The user records a receipt into a bank or wallet with a `REPAYMENT` line taken from the loan account. The Cash balance rises and the amount owed falls.
3. **See what is owed.** Balances and summaries show each loan's outstanding amount and the total.

One payment may combine a loan with other lines, for example 1,000.00 lent plus 200.00 for Dining.

## Business rules

- A `LOAN_GIVEN` line is allowed only on the payment form, only to an owned, non-archived `LOAN_GIVEN` account, and only when the payment's source is `CASH`. Lending from a credit card is out of scope and returns 400.
- **BR-12** applies to the Cash source (README §4).
- **Proposed BR-14, no over-repayment of a loan given:** a `REPAYMENT` line on the receive form must not exceed that loan account's current outstanding balance. Repaying exactly the outstanding amount, which brings it to 0.00, is allowed. Error 400 `"The repayment is more than the amount owed on this loan."`. The check runs in the same database transaction with `SELECT ... FOR UPDATE` on the loan account row.
- A loan-given balance therefore never goes below 0.00 through receipts.

## API

No new endpoints. The Sprint 1 transaction endpoints accept the new line types (README §2).

| Use | Request |
|---|---|
| Lend | `POST /api/transactions/payment` `{ "totalAmount": "1000.00", "date": "2026-11-26", "sourceAccountId": <bank>, "note": "Lent to Somchai", "allocations": [{ "accountId": <loanGiven>, "allocationType": "LOAN_GIVEN", "amount": "1000.00" }] }` |
| Receive a repayment | `POST /api/transactions/receive` `{ "totalAmount": "400.00", "date": "2026-11-28", "receivingAccountId": <bank>, "allocations": [{ "accountId": <loanGiven>, "allocationType": "REPAYMENT", "amount": "400.00" }] }` |
| Outstanding | `GET /api/summaries/balances` (the loan's balance) and `GET /api/summaries` (`loansGivenOutstanding`) |

Success: 201 with the Sprint 1 transaction shape plus `note`. Errors: 400 for a wrong line type or account type, a total mismatch, a lend from a card, BR-12 or BR-14; 403 for another user's account or an Administrator; 401 with no session; 404 for a missing account.

## Data

No schema change beyond README §6. `AllocationType.LOAN_GIVEN` and `REPAYMENT` already exist.

## UI (implemented in Issue 06)

The **Record** screen's payment form offers "Loan given" as a line type, and the receive form offers "Repayment of a loan given", filtered to `LOAN_GIVEN` accounts. The **Loans** screen lists each loan given with its outstanding amount and its history.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-54 | Lending 1,000.00 from a bank lowers the bank balance by 1,000.00 and raises the loan-given balance to 1,000.00. The transaction persists in history. |
| AC-55 | Receiving a 400.00 repayment raises the bank balance by 400.00 and lowers the loan outstanding to 600.00. Repayments are excluded from income and expense summaries. |
| AC-56 | A repayment of exactly the outstanding amount succeeds and leaves 0.00. 0.01 more returns 400 (BR-14) and writes nothing. |
| AC-57 | A loan from a bank holding less than the amount returns 400 (BR-12) and writes nothing. A loan leaving exactly 0.00 succeeds. |
| AC-58 | A `LOAN_GIVEN` line to a non-loan account, a loan from a credit-card source, or a `REPAYMENT` line on a non-`LOAN_GIVEN` account on the receive form returns 400. |
| AC-59 | Another user's loan account or Cash account returns 403, and an Administrator gets 403, with no write. `loansGivenOutstanding` counts only the user's own loans. |
| AC-59-UI | The Loans screen shows each loan's outstanding amount, and the receive form shows the BR-14 message. Verified in Issue 06. |

## Test specification

File `server/tests/f10-loan-given.api.test.ts`. Setup: user A has a bank with a 2,000.00 opening balance and a `LOAN_GIVEN` account "Loan to Somchai". User B has their own bank and loan account.

| Test | Level | AC | Input | Expected result |
|---|---|---|---|---|
| TEST-47 | API/DB | AC-54 | Lend 1,000.00 from the bank to the loan. | 201. Balances: bank 1,000.00, loan 1,000.00. Visible in `GET /api/transactions`. `loansGivenOutstanding` is 1000. |
| TEST-48 | API/DB | AC-55 | After TEST-47, receive 400.00 into the bank as `REPAYMENT` from the loan. | 201. Bank 1,400.00, loan 600.00. `/api/summaries` `income` and `expenses` are unchanged. |
| TEST-49 | API/DB | AC-56 | After TEST-48, receive 600.01, then 600.00. | 600.01 → 400 with the BR-14 message and no new transaction. 600.00 → 201 and the loan is 0.00. |
| TEST-50 | API/DB | AC-57 | Bank 500.00. Lend 500.01, then 500.00. | 500.01 → 400 `"Insufficient balance in the source cash account."`, with no write. 500.00 → 201 and the bank is 0.00. |
| TEST-51 | API/DB | AC-58 | (a) A `LOAN_GIVEN` line to Dining. (b) Lend with the credit card as source. (c) A receive-form `REPAYMENT` line on the credit card. | All return 400. The transaction count is unchanged. |
| TEST-52 | API/DB | AC-59 | A lends to B's loan account. A lends from B's bank. An Administrator lends. Then check B's summary. | 403, 403 and 403, with no write. B's `loansGivenOutstanding` excludes A's loans. |

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature). TEST-47 to TEST-52 pass, and the BR-14 ID is confirmed against the Deliverable 1 SRS.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract. | #73 |
