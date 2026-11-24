# F-06 Credit-card Repayment and Financial Overview

**Contract version:** 1.1 (Lab 7 amendment to v1.0; change request Issue #62)

## Purpose and scope

Allow an authenticated `USER` to repay credit-card debt from their own bank account and view the complete Sprint 1 financial overview. Lab 7 adds BR-12 to repayment only; other transaction flows are unchanged.

## API and persistence

- `POST /api/transactions/repayment` records a repayment.
- The source account must be the authenticated user's bank account.
- The destination must be the authenticated user's credit-card account.
- The repayment is persisted as a transaction with a `REPAYMENT` allocation.
- Account balances use the source and receiving account fields so bank balance decreases and card debt decreases.
- Repayments are excluded from income and expense summaries.
- A repayment that would make the source Cash account balance negative is rejected. A repayment that leaves the balance exactly zero is accepted.

## Validation and access

- Reject missing, zero, negative, malformed, non-finite, or over-precision amounts.
- Reject invalid dates, non-bank source accounts, non-credit-card destinations, nonexistent accounts, and accounts owned by another user.
- Require an authenticated, enabled `USER` session.
- Derive ownership from the authenticated session.
- Apply the BR-12 balance check after authentication, amount, date, ownership, and account-type validation.
- Calculate the source account's current all-time balance using the same opening-balance-plus-inflows-minus-outflows calculation as `/api/summaries/balances`.
- If the repayment would make that balance negative, return HTTP 400 with `{ "error": "Insufficient bank balance for this repayment." }` and write no transaction or allocation rows. Do not include a balance figure in the response.
- Preserve the existing access responses: unauthenticated requests return 401; cross-owner requests and Administrator financial requests return 403. These checks run before the balance check.
- The client does not pre-check the balance; it displays the server's rejection message on the repayment form.
- Repaying more than the credit-card debt remains allowed. Lowering an opening balance below prior spending is outside this change.

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
| AC-37 | Repaying 0.01 more than the source balance returns 400; no transaction or allocation is stored and balances are unchanged. |
| AC-38 | A repayment that leaves the source balance exactly 0.00 returns 201. |
| AC-39 | Competing repayments whose total exceeds the source balance result in at most one stored repayment; the balance never becomes negative. |
| AC-40 | The repayment form displays the server's insufficient-balance message. |

## Lab 7 test specifications

All API cases use an authenticated, enabled `USER` who owns the source bank account and destination credit-card account. Use a valid transaction date. For TEST-28 through TEST-30, prepare an opening bank balance of 500.00 and a card debt of at least 600.00.

| Test | Preconditions and input | Action | Expected result |
|---|---|---|---|
| TEST-28 (AC-37) | Bank balance 500.00; card debt at least 600.00; repayment amount 500.01. Record the transaction count before the request. | Submit one repayment. | HTTP 400 `{ "error": "Insufficient bank balance for this repayment." }`; no transaction or allocation is added; bank balance remains 500.00. The response contains no balance figure. |
| TEST-29 (AC-38) | Bank balance 500.00; card debt at least 600.00; repayment amount 500.00. | Submit one repayment. | HTTP 201; bank balance is exactly 0.00. |
| TEST-30 (AC-39) | Bank balance 500.00; card debt at least 600.00; two repayment requests of 300.00. | Submit both requests concurrently with `Promise.all`. | Exactly one request returns 201 and one returns 400; only one repayment is stored; bank balance is 200.00 and never negative. |
| TEST-31 (AC-40) | Client repayment form populated with valid owned accounts, amount, and date; mocked API response is HTTP 400 with the BR-12 message. | Submit the repayment form. | The form displays `Insufficient bank balance for this repayment.` from the server response. |
| TEST-32 (preserved behavior) | Bank balance 1,000.00; card debt 100.00; repayment amount 300.00. | Submit one repayment. | HTTP 201; the bank balance decreases by 300.00 and the credit-card account shows a 200.00 credit. Card overpayment remains accepted. |

The existing authentication, Administrator-denial, and ownership checks remain in force. A cross-owner account request must still return 403 before any balance check can expose account-balance information.

## Definition of Done

The repayment form, API, persistence, calculations, overview, ownership rules, complete journey test, and UI/API tests pass, and the teammate reviews the pull request. Lab 7 also requires TEST-28–TEST-32, including the concurrent-repayment case, while preserving the existing access-control and card-overpayment behavior.
