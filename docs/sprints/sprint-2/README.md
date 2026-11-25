# Sprint 2 Contracts: Index and Shared Ledger Rules

**Contract version:** 1.0 (Sprint 2 setup, Issue 00 / #73). Written before any Sprint 2 implementation.
**Plan:** [docs/delivery2.md](../../delivery2.md)

This file defines the rules every Sprint 2 feature shares. Each feature contract links here instead of repeating them. Changes after the contracts PR merges must update the version history in this file and in the affected contract.

## 1. Feature index

| Feature | Contract | Issue / branch | Owner → Reviewer | AC | Tests |
|---|---|---|---|---|---|
| F-08 Account management | [F-08](F-08-account-management.md) | 02 `SP2-02-F08-F09-accounts-opening-balance` | Thanaphon → Tana | AC-41–AC-48 | TEST-33–TEST-41 |
| F-09 Opening-balance management | [F-09](F-09-opening-balance-management.md) | 02 (same branch) | Thanaphon → Tana | AC-49–AC-53 | TEST-42–TEST-46 |
| F-10 Loan Given | [F-10](F-10-loan-given.md) | 03 `SP2-03-F10-F11-loans` | Thanaphon → Tana | AC-54–AC-59 | TEST-47–TEST-52 |
| F-11 Loan Taken and borrowing | [F-11](F-11-loan-taken-borrowing.md) | 03 (same branch) | Thanaphon → Tana | AC-60–AC-66 | TEST-53–TEST-59 |
| F-12 Transfers and the shared Cash-outflow rule | [F-12](F-12-transfers.md) | 01 `SP2-01-br12-shared-check-transfers` | Tana → Thanaphon | AC-67–AC-74 | TEST-60–TEST-68 |
| F-13 Transaction corrections | [F-13](F-13-transaction-corrections.md) | 04 `SP2-04-F13-transaction-corrections` | Tana → Thanaphon | AC-75–AC-82 | TEST-69–TEST-77 |
| F-14 Transaction search and filtering | [F-14](F-14-transaction-search.md) | 05 `SP2-05-F14-transaction-search` | Tana → Thanaphon | AC-83–AC-89 | TEST-78–TEST-85 |

UI acceptance criteria in each contract are implemented and tested in Issue 06 (`SP2-06-ui/sprint2-screens`), per decision D-5 in the plan. API acceptance criteria are implemented and tested on the feature's own branch.

### Requirement links

Each feature traces to the Sprint 2 scope in `PROJECT_PLAN.md` ("Sprint 2: core expansion"). The Deliverable 1 SRS FR numbers are not stored in the repository, because `docs/srs.md` holds only the Lab 7 amendment. **Before this PR merges, fill the FR column below from the Deliverable 1 SRS.** The same IDs then go into the Part D traceability matrix.

| Sprint 2 scope item (`PROJECT_PLAN.md`) | Feature | Deliverable 1 FR / BR |
|---|---|---|
| Create and manage all five account types | F-08 | _fill from D1 SRS_ |
| Wallet and bank-account management | F-08, F-09 | _fill from D1 SRS_ |
| Improved opening-balance management | F-09 | _fill from D1 SRS_ |
| Loan Given workflows | F-10 | _fill from D1 SRS_ |
| Loan Taken and borrowing workflows | F-11 | _fill from D1 SRS_ |
| Loan repayments beyond the Sprint 1 card repayment | F-10, F-11 | _fill from D1 SRS_ |
| Transfers | F-12 | _fill from D1 SRS_ |
| Transaction corrections | F-13 | _fill from D1 SRS_ |
| Transaction search and filtering | F-14 | _fill from D1 SRS_ |
| BR-12 no overdraft (approved Lab 7 change) extended to every Cash outflow | F-12 (shared), F-09, F-10, F-13 | BR-12 |

New business rules proposed by these contracts are **BR-13** and **BR-14**. Check them against BR-01 to BR-11 in the Deliverable 1 SRS before merge. If an existing rule already covers one, use that ID instead.

## 2. Allocation matrix (both transaction forms)

Sprint 1 allowed only `EXPENSE` lines on a credit card and `INCOME` lines into a bank. Sprint 2 opens the full matrix from `PROJECT_PLAN.md` ("Transaction forms"):

| Form | Account side | Allowed account | Allocation type | Line account must be | Effect on the line account |
|---|---|---|---|---|---|
| Payment or charge | Source | `CASH` (bank or wallet) or `LOAN_TAKEN` (card or other) | `EXPENSE` | `EXPENSE` | Expense summary + amount |
| | | | `REPAYMENT` | `LOAN_TAKEN`, not the source | Debt reduced (balance + amount) |
| | | | `LOAN_GIVEN` | `LOAN_GIVEN` | Amount owed to the user + amount |
| | | | `TRANSFER` | `CASH`, not the source | Balance + amount |
| Receive money | Receiving | `CASH` (bank or wallet) | `INCOME` | `INCOME` | Income summary + amount |
| | | | `REPAYMENT` | `LOAN_GIVEN` | Amount owed to the user − amount |
| | | | `BORROWING` | `LOAN_TAKEN` | Debt increased (balance − amount) |
| | | | `TRANSFER` | `CASH`, not the receiving account | Balance − amount |

- One transaction may mix line types, for example a bank payment that is partly an expense and partly a loan given.
- The line amounts must total the transaction amount exactly. This is the existing Sprint 1 rule (AC-25, AC-26).
- Every referenced account must belong to the authenticated user and must not be archived (F-08).

## 3. Balance calculation (decision D-10)

**Problem in the Sprint 1 code:** `calculateAccountBalances()` uses only `Transaction.sourceAccountId` (outflow) and `Transaction.receivingAccountId` (inflow). A line that moves money into a second balance account, such as a transfer, a loan given or a loan repayment, therefore never changes that account's balance. The Sprint 1 repayment works only because it also sets `receivingAccountId` to the card.

**Sprint 2 rule.** These balances are signed: positive means the user has the money or is owed it, negative means the user owes it. For an account *A* of type `CASH`, `LOAN_GIVEN` or `LOAN_TAKEN`:

```text
balance(A) = openingBalance(A)
           + Σ totalAmount of RECEIVE_MONEY transactions where receivingAccountId = A
           − Σ totalAmount of PAYMENT_OR_CHARGE transactions where sourceAccountId = A
           + Σ PAYMENT_OR_CHARGE allocation lines on A of type REPAYMENT, LOAN_GIVEN or TRANSFER
           − Σ RECEIVE_MONEY allocation lines on A of type REPAYMENT, BORROWING or TRANSFER
```

- On a `PAYMENT_OR_CHARGE` transaction, `receivingAccountId` is informational only and is no longer used in the calculation. Sprint 1 repayments therefore keep the same balances with no data migration: the card still gains the amount, now through its `REPAYMENT` line. TEST-10, TEST-28 to TEST-32 and AC-31/AC-32 guard this.
- `INCOME` and `EXPENSE` accounts keep the Sprint 1 behavior (a balance of 0, with totals in summaries). F-15 in Sprint 3 handles category totals.
- `GET /api/summaries/balances` returns this balance for every account, including archived ones.
- `GET /api/summaries` adds `loansGivenOutstanding` (Σ positive `LOAN_GIVEN` balances) and `loansTakenOutstanding` (Σ of −balance over `LOAN_TAKEN` accounts with a negative balance). The existing `income` and `expenses` fields are unchanged.

## 4. BR-12 extended to every Cash outflow (decision D-3)

> **BR-12:** An outflow from a Cash account must not make its balance negative. A balance of exactly 0.00 is allowed.

| Version | Scope |
|---|---|
| Lab 7 (v1.1.0) | `POST /api/transactions/repayment` only |
| Sprint 2 (this contract) | Every write that lowers a `CASH` balance: a payment-form transaction with a `CASH` source, a receive-form `TRANSFER` line taken from a `CASH` account, a lower opening balance (F-09), and an edit or delete (F-13) |

Enforcement, shared by all features:

1. Check in this order: authentication (401) → role (403) → request shape (400) → account existence (404) and ownership (403) → archived (400) → account types and allocation matrix (400) → allocation total (400) → BR-12 (400).
2. Run the BR-12 check inside one `prisma.$transaction`. Lock every affected `CASH` account row first with `SELECT ... FOR UPDATE`, in ascending ID order so competing requests cannot deadlock.
3. Compute each locked account's balance after the write, using §3. If any is below 0.00, roll back and write nothing.
4. Error bodies contain no balance figure:
   - Repayment endpoint (unchanged, guarded by TEST-28): `{ "error": "Insufficient bank balance for this repayment." }`
   - Every other outflow: `{ "error": "Insufficient balance in the source cash account." }`
   - Opening balance (F-09) and corrections (F-13): `{ "error": "This change would make a cash account balance negative." }`
5. One server helper implements this (working name `assertCashBalancesNotNegative(tx, ownerUserId, accountIds)`). Issue 01 extracts it from the Lab 7 repayment code. No client-side check counts as enforcement.
6. Unchanged: card and loan-taken overpayment is allowed (TEST-32). `LOAN_TAKEN` and `LOAN_GIVEN` accounts have no BR-12 floor.

## 5. Shared validation, access and errors

- Amounts: positive decimal, at most **2** decimal places, below 10^35. This closes the Lab 7 minor defect where the parser accepted 30 decimal places. Opening balances may also be 0. Error: `{ "error": "A valid positive amount is required." }`. Issue 01 moves `parsePositiveAmount()` to 2 places and adds the regression test.
- Dates: `YYYY-MM-DD` calendar dates, validated as today (`parseCalendarDate`).
- Note (new, optional): a trimmed string of at most 200 characters on every transaction-creating request and on corrections. An empty string is stored as `null`. Error: `{ "error": "The note must be 200 characters or fewer." }`.
- Access is the same as Sprint 1. No session gives 401. An `ADMINISTRATOR` on any financial endpoint gets 403. Another user's account or transaction gets 403 with no data. A missing record gives 404. A business-rule conflict gives 409 where a contract says so.
- A failed request writes no transaction, allocation or account change.

## 6. Shared data changes

| Change | Migration | Introduced by |
|---|---|---|
| `Transaction.note String? @db.VarChar(200)` | `sprint2_transaction_note_updated_at` | Issue 01 |
| `Transaction.updatedAt DateTime @default(now()) @updatedAt` | same migration | Issue 01 |
| `Account.archivedAt DateTime?` | `sprint2_account_archive` | Issue 02 |
| No change to the `AllocationType` or `AccountType` enums | — | — |

All three are additive, so existing rows stay valid. The migrations run through the existing `prisma migrate deploy` step in the container entrypoint.

## 7. Sprint 2 Definition of Done (applies to every feature)

- The contract was merged before implementation, and any later change is recorded in its version history.
- Every API AC is covered by a passing automated API/DB test against PostgreSQL, and every UI AC by a passing client test. Each rule includes negative and boundary tests.
- TDD: a RED commit (failing test) precedes a GREEN commit (implementation), and both outputs are saved in the PR.
- The Sprint 1 and Lab 7 suites still pass unchanged (TEST-01 to TEST-32 and the existing F-01 to F-07 tests).
- The PR into `sprint2-staging` passed CI and has a teammate review with a specific comment.
- The feature is included in the reviewed release `v2.0.0` on `main`, deployed, and passes the post-deployment checks in Issue 07.
- The README, `UI-specs.md` (Issue 06) and setup instructions are current, and incomplete work is disclosed.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0.1 | 2026-11-25 | Owners changed: F-08 to F-11 → Thanaphon; F-12 to F-14 → Tana (reviewers swapped). No contract content changed. | #73 |
| 1.0 | 2026-11-25 | First Sprint 2 contract set: allocation matrix, balance rule D-10, BR-12 extension, shared validation and data changes. | #73 |
