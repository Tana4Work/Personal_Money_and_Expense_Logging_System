# F-09 Opening-balance Management

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 02, branch `SP2-02-F08-F09-accounts-opening-balance`.
**Extends:** [F-03 Opening Balance](../sprint-1/F-03-opening-balance.md) (Sprint 1, bank accounts only).
**Shared rules:** [Sprint 2 README](README.md) §3–§7.

## Purpose and scope

An authenticated `USER` can record or correct the opening balance of every balance account: bank, wallet, loan given and loan taken. Correcting it must not create an overdraft.

This closes the Lab 7 debt item "editing the opening balance can make a balance negative" (D-8).

## Workflow

1. On **Accounts**, the user selects **Set opening balance** for a balance account and enters an amount and date.
2. For `CASH` accounts the server computes the balance that would result (§3, with the new opening balance). If it is below 0.00 the request is rejected.
3. The new value replaces the old one. Calling the endpoint again is how a correction is made.

## Business rules

| Account type | Input `amount` | Stored `openingBalance` | Meaning |
|---|---|---|---|
| `CASH` (bank or wallet) | ≥ 0.00 | `+amount` | Money held at the start |
| `LOAN_GIVEN` | ≥ 0.00 | `+amount` | Already owed to the user at the start |
| `LOAN_TAKEN` (card or other) | ≥ 0.00 | `−amount` | Already owed by the user at the start |
| `INCOME`, `EXPENSE` | — | not allowed | 400 |

- **BR-12 (D-8):** for a `CASH` account, the balance after the change must be ≥ 0.00. Exactly 0.00 is allowed.
- The account must not be archived.
- The amount uses the shared rule (at most 2 decimal places). 0 is allowed here.

## API

`POST /api/accounts/:accountId/opening-balance`: same path and body as Sprint 1, `{ "amount": "1500.00", "date": "2026-11-01" }`.

| Result | Status and body |
|---|---|
| Success | 200 `Account`. For `LOAN_TAKEN`, `openingBalance` is negative, for example `"-1500"`. |
| Wrong account type | 400 `"Opening balances can only be recorded for cash and loan accounts."` (replaces the Sprint 1 bank-only message) |
| Invalid amount or date | 400 with the Sprint 1 messages |
| Would overdraw Cash | 400 `"This change would make a cash account balance negative."`, with nothing changed |
| Archived account | 400 `"This account is archived."` |
| Access | 401, 403 (another user or an Administrator), 404 |

The update and the BR-12 check run in one `prisma.$transaction` with `SELECT ... FOR UPDATE` on the account row (README §4).

## Data

No schema change. `openingBalance` and `openingBalanceDate` already exist.

## UI (implemented in Issue 06)

Each balance account row on **Accounts** has an **Opening balance** form (amount and date). For a loan-taken account it is labelled "Amount owed at start". The form shows the server rejection message.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-49 | A user can record an opening balance for a wallet, and the wallet balance equals it. Sprint 1 bank behavior is unchanged (TEST-06 still passes). |
| AC-50 | Opening balances for `LOAN_GIVEN` and `LOAN_TAKEN` accounts are stored with the signs in the table, and appear in `/api/summaries/balances` and in the outstanding totals in `/api/summaries`. |
| AC-51 | Correcting a Cash opening balance down to a value that leaves the balance at exactly 0.00 succeeds. A value 0.01 lower returns 400 and nothing changes. |
| AC-52 | An opening balance on an `INCOME`, `EXPENSE` or archived account returns 400. |
| AC-53 | Another user's account returns 403, an Administrator gets 403, and no session gets 401, with nothing changed. |
| AC-53-UI | The opening-balance form shows the server's BR-12 message. Verified in Issue 06. |

## Test specification

File `server/tests/f09-opening-balance-management.api.test.ts`.

| Test | Level | AC | Preconditions and input | Expected result |
|---|---|---|---|---|
| TEST-42 | API/DB | AC-49 | A new wallet. Opening balance 750.00 dated 2026-11-01, then re-fetch. | 200. The wallet balance is 750.00 after a re-fetch. The existing F-03 tests also pass. |
| TEST-43 | API/DB | AC-50 | A `LOAN_GIVEN` account with 300.00 and a `LOAN_TAKEN/OTHER` account with 1,000.00. | `openingBalance` is `"300"` and `"-1000"`. The balances match. `loansGivenOutstanding` is 300 and `loansTakenOutstanding` is 1000. |
| TEST-44 | API/DB | AC-51 | Bank opening balance 1,000.00, then a 400.00 payment from the bank, so the balance is 600.00. Change the opening balance to 400.00, then to 399.99. | 400.00 → 200 and the balance is 0.00. 399.99 → 400 with the BR-12 message, and `openingBalance` stays 400. |
| TEST-45 | API/DB | AC-52 | Opening balance on Salary (`INCOME`), on Dining (`EXPENSE`), and on an archived wallet. | 400 with the specified messages. No account changes. |
| TEST-46 | API/DB | AC-53 | User B and an Administrator post an opening balance to A's wallet. A request with no token. | 403, 403 and 401. A's wallet is unchanged. |

TEST-44 depends on Issue 01, which lets a payment use a `CASH` source. If Issue 02 merges first, TEST-44 lowers the balance with a transfer (F-12) or is marked pending until Issue 01 merges. The PR must record which.

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature). TEST-42 to TEST-46 pass, and the F-03 tests (TEST-06 and `server/tests/f03-opening-balance.api.test.ts`) pass with one disclosed revision.

**Justified Sprint 1 test revision.** The f03 case "rejects non-bank account types and leaves category balances unchanged" currently expects a **wallet** opening balance to return 400. F-09 makes that request valid, so the case changes as follows:

- The wallet assertion becomes 200 and moves to TEST-42.
- The Salary (`INCOME`) assertion stays 400, unchanged.
- Category accounts must still show zero opening balances.

The change is made in the RED commit of Issue 02, with this contract version as the reason, and is listed in the Part B completion table. No other Sprint 1 assertion is weakened.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract. Extends F-03 to wallets and loan accounts, and applies BR-12 (D-8). | #73 |
