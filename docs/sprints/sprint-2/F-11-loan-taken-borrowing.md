# F-11 Loan Taken and Borrowing

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 03, branch `SP2-03-F10-F11-loans`.
**Extends:** [F-05](../sprint-1/F-05-split-payment.md) (card charges) and [F-06](../sprint-1/F-06-repayment-overview.md) (card repayment, BR-12).
**Shared rules:** [Sprint 2 README](README.md) §2–§7.

## Purpose and scope

An authenticated `USER` can:

- record money borrowed into a bank or wallet;
- charge purchases to any loan-taken account, not only the seeded credit card;
- repay any loan-taken account from a bank or wallet;
- see total debt.

Sprint 1 supported only a credit-card charge and a bank-to-card repayment.

Out of scope: interest, minimum payments, credit limits and statements.

## Workflow

1. **Borrow.** The user records a receipt into Cash with a `BORROWING` line from a `LOAN_TAKEN` account, for example "Loan from Mom". Cash rises and debt rises (the loan balance becomes more negative).
2. **Charge.** The user records a payment whose source is any `LOAN_TAKEN` account (card or other), with `EXPENSE` lines. Debt rises.
3. **Repay.** Either use `POST /api/transactions/repayment` (source Cash, destination any `LOAN_TAKEN`), or add a payment-form `REPAYMENT` line from a Cash source. Cash falls under BR-12, and debt falls.

## Business rules

- A `BORROWING` line is allowed only on the receive form, to an owned, non-archived `LOAN_TAKEN` account.
- A payment-form source may be `LOAN_TAKEN` of subtype `CREDIT_CARD` **or** `OTHER`. From a `LOAN_TAKEN` source, only `EXPENSE` lines are allowed. A loan cannot be used to pay off another loan or to make a transfer.
- Repayment endpoint, generalized:
  - The source is `CASH` of subtype `BANK` **or** `WALLET`.
  - The destination is `LOAN_TAKEN` of subtype `CREDIT_CARD` **or** `OTHER`.
  - Source and destination must differ.
- **BR-12** applies to every Cash source. The repayment endpoint keeps its exact Lab 7 message (TEST-28).
- Repaying more than the debt is still allowed. This is the existing behavior guarded by TEST-32, and the account then shows a credit.
- Validation messages for the generalized checks:

  | Request | Message |
  |---|---|
  | Repayment source | `"Repayments must use a bank or wallet account."` |
  | Repayment destination | `"Repayments must use a loan-taken account."` |
  | Payment source | `"Payments must use a cash or loan-taken account."` |

## API

| Use | Request |
|---|---|
| Borrow | `POST /api/transactions/receive` `{ "totalAmount": "5000.00", "date": "2026-11-26", "receivingAccountId": <bank>, "allocations": [{ "accountId": <loanFromMom>, "allocationType": "BORROWING", "amount": "5000.00" }] }` |
| Charge to another loan | `POST /api/transactions/payment` with `sourceAccountId: <loanTakenOther>` and `EXPENSE` lines |
| Repay (endpoint) | `POST /api/transactions/repayment` `{ "totalAmount": "1000.00", "date": "2026-11-27", "sourceAccountId": <wallet>, "receivingAccountId": <loanFromMom> }` |
| Repay (line) | `POST /api/transactions/payment` from a Cash source with `{ "allocationType": "REPAYMENT", "accountId": <loanTaken> }` |
| Debt total | `GET /api/summaries` → `loansTakenOutstanding` |

Status codes follow README §5. Success is 201 with the transaction, including `note`.

## Data

No schema change beyond README §6. Under the balance rule (D-10), a repayment's `receivingAccountId` is informational. The endpoint keeps setting it for compatibility.

## UI (implemented in Issue 06)

- The receive form offers "Borrowing" as a line type, filtered to `LOAN_TAKEN` accounts.
- The payment form's source list includes every loan-taken account.
- The repayment form allows a wallet source and any loan-taken destination.
- The **Loans** screen lists loans taken with the amount owed.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-60 | Borrowing 5,000.00 into a bank raises the bank balance by 5,000.00 and the loan-taken debt by 5,000.00. It is excluded from income. |
| AC-61 | A charge to a `LOAN_TAKEN/OTHER` account with `EXPENSE` lines raises that account's debt and the expense summary. |
| AC-62 | A repayment from a wallet to a `LOAN_TAKEN/OTHER` account through the repayment endpoint lowers wallet and debt by the amount. |
| AC-63 | A payment-form `REPAYMENT` line from a bank to the credit card lowers the card debt exactly as the Sprint 1 repayment does. The Sprint 1 journey test and TEST-28 to TEST-32 pass unchanged. |
| AC-64 | A repayment from a wallet holding less than the amount returns 400 with the Lab 7 message and writes nothing. Card overpayment is still accepted. |
| AC-65 | A `BORROWING` line to a non-`LOAN_TAKEN` account, a `LOAN_TAKEN` source with a non-`EXPENSE` line, or a repayment to a `CASH` destination returns 400 with no write. |
| AC-66 | Another user's loan or Cash account returns 403, an Administrator gets 403, and no session gets 401. `loansTakenOutstanding` counts only the user's own debt. |
| AC-66-UI | The Loans screen shows each loan taken's debt. The repayment form lists wallets and every loan-taken account. Verified in Issue 06. |

## Test specification

File `server/tests/f11-loan-taken-borrowing.api.test.ts`. Setup: user A has a bank (opening balance 1,000.00), a wallet, the seeded credit card, and a `LOAN_TAKEN/OTHER` account "Loan from Mom". User B has their own accounts.

| Test | Level | AC | Input | Expected result |
|---|---|---|---|---|
| TEST-53 | API/DB | AC-60 | Receive 5,000.00 into the bank as `BORROWING` from "Loan from Mom". | 201. Bank 6,000.00, loan −5,000.00. `loansTakenOutstanding` is 5000. `income` is unchanged. |
| TEST-54 | API/DB | AC-61 | Pay 300.00 from "Loan from Mom" with a Dining `EXPENSE` line. | 201. Loan −5,300.00. `expenses` up by 300. |
| TEST-55 | API/DB | AC-62 | Wallet opening balance 2,000.00. Repay 1,000.00 from the wallet to "Loan from Mom". | 201. Wallet 1,000.00, loan −4,300.00. |
| TEST-56 | API/DB | AC-63 | Card charge 2,000.00, then a payment from the bank with a single `REPAYMENT` line of 2,000.00 to the card. Then run the f06 suite. | 201. Card 0.00, bank down by 2,000.00. The f06 tests, including TEST-28 to TEST-32, pass. |
| TEST-57 | API/DB | AC-64 | Wallet 100.00. Repay 100.01 from the wallet, then repay the card 300.00 when the card debt is 100.00 and the bank holds 1,000.00. | The wallet repayment → 400 `"Insufficient bank balance for this repayment."` with no write. The card overpayment → 201 and the card shows +200.00. |
| TEST-58 | API/DB | AC-65 | (a) A `BORROWING` line to Salary. (b) A source of "Loan from Mom" with a `TRANSFER` line. (c) A repayment with destination the wallet. | All return 400. The count is unchanged. |
| TEST-59 | API/DB | AC-66 | A borrows into B's bank. A repays B's loan. An Administrator repays. No token. Then check B's summary. | 403, 403, 403 and 401, with no writes. B's `loansTakenOutstanding` excludes A's debt. |

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature). TEST-53 to TEST-59 pass. The F-05 and F-06 Sprint 1 tests pass without changes to their assertions.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract. Generalizes F-05 and F-06 to all loan-taken accounts and wallet sources. | #73 |
