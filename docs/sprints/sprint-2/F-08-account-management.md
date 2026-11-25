# F-08 Account Management

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 02, branch `SP2-02-F08-F09-accounts-opening-balance`.
**Shared rules:** [Sprint 2 README](README.md) §2–§7.

## Purpose and scope

An authenticated `USER` can create, rename, archive, restore and delete their own accounts, of all five types, including bank and wallet Cash accounts. Sprint 1 gave each user only the five seeded accounts and had no way to manage them.

Out of scope: changing an account's type or subtype after creation, shared accounts, and Administrator access to accounts.

## Workflow

1. The user opens **Accounts** and selects **New account**, then enters a name, type and subtype.
2. The server validates the request and creates the account with an opening balance of 0. The account appears in the list and in the forms that accept its type.
3. The user can rename an account at any time.
4. The user can archive an account they no longer use. If it is a balance account (`CASH`, `LOAN_GIVEN` or `LOAN_TAKEN`), its balance must be 0.00. An archived account disappears from form choices but stays in history, balances and summaries. The user can restore it.
5. The user can delete an account only if nothing references it: no transaction, no allocation line and an opening balance of 0. Otherwise the server says to archive it instead (D-7).

## Business rules

- **Type and subtype pairs** (rejected otherwise):

  | Type | Allowed subtypes |
  |---|---|
  | `CASH` | `BANK`, `WALLET` |
  | `LOAN_TAKEN` | `CREDIT_CARD`, `OTHER` |
  | `LOAN_GIVEN` | `OTHER` |
  | `INCOME` | `OTHER` |
  | `EXPENSE` | `OTHER` |
- **Name:** 1–60 characters after trimming. Unique per owner, case-insensitively, archived accounts included.
- **Archive rule (proposed BR-13):** a `CASH`, `LOAN_GIVEN` or `LOAN_TAKEN` account can be archived only when its §3 balance is exactly 0.00. `INCOME` and `EXPENSE` accounts can be archived at any time.
- **Delete rule (D-7):** hard delete only when the account has no transactions as source or receiving account, no allocation lines and an opening balance of 0.
- Archived accounts cannot be used in any new transaction, transfer, repayment or opening-balance change (400).

## API

| Method and path | Request | Success | Errors |
|---|---|---|---|
| `GET /api/accounts?includeArchived=true` | Query is optional. By default archived accounts are excluded. | 200 `Account[]` | 401, 403 (Administrator) |
| `POST /api/accounts` | `{ "name": "Wallet", "type": "CASH", "subtype": "WALLET" }` | 201 `Account` | 400 invalid name, type or pair; 409 duplicate name |
| `PATCH /api/accounts/:accountId` | `{ "name": "Main bank" }`. Any `type` or `subtype` field → 400 | 200 `Account` | 400, 403 other user, 404, 409 duplicate name |
| `POST /api/accounts/:accountId/archive` | — | 200 `Account` with `archivedAt` set | 403, 404, 409 non-zero balance, 409 already archived |
| `POST /api/accounts/:accountId/restore` | — | 200 `Account` with `archivedAt: null` | 403, 404, 409 not archived |
| `DELETE /api/accounts/:accountId` | — | 204 | 403, 404, 409 account in use |

The `Account` response adds `archivedAt` (ISO string or `null`) to the Sprint 1 shape. `GET /api/accounts/:accountId` returns archived accounts as well.

Error messages:

| Case | Message |
|---|---|
| Invalid name | `"Account name must be 1 to 60 characters."` |
| Invalid type | `"A valid account type is required."` |
| Invalid pair | `"This subtype is not allowed for this account type."` |
| Type change attempted | `"Account type and subtype cannot be changed."` |
| Duplicate name | `"An account with this name already exists."` |
| Archive with a balance | `"Only an account with a zero balance can be archived."` |
| Delete while in use | `"This account has transactions. Archive it instead."` |
| Using an archived account | `"This account is archived."` |

## Data

- Migration `sprint2_account_archive`: `Account.archivedAt DateTime?` (nullable, default `null`).
- Name uniqueness is enforced in application code with a case-insensitive lookup inside the create or rename database transaction. No unique index is added, because the existing seeded rows were never checked for case-insensitive duplicates.
- The `onDelete: Restrict` relations already prevent deleting an account that transactions reference. The API checks first so it can return 409 rather than a database error.

## Access

`USER` only. The server takes ownership from the session. Another user's account → 403 `"Account access is not allowed."` with no account data. Administrator → 403. No session → 401.

## UI (implemented in Issue 06)

The **Accounts** screen lists accounts grouped by type, showing name, subtype, balance and status. It has a **New account** form where the subtype choices change with the type, inline rename, archive and restore buttons, and a delete button that shows the server's 409 message. A **Show archived** toggle shows archived accounts.

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-41 | A user can create an account of each of the five types with an allowed subtype. It is returned by `GET /api/accounts` and persists after a re-fetch. |
| AC-42 | An invalid type, a disallowed subtype pair, or an empty or over-60-character name returns 400 and creates nothing. |
| AC-43 | A duplicate name for the same user (case-insensitive) returns 409. The same name used by a different user is allowed. |
| AC-44 | A user can rename their own account. Changing the type or subtype returns 400. |
| AC-45 | A zero-balance account can be archived and restored. Archived accounts are excluded from the default list and rejected as transaction accounts (400). |
| AC-46 | Archiving a Cash or loan account with a non-zero balance returns 409, and the account stays active. |
| AC-47 | An unused account can be deleted (204). An account with transactions returns 409 and is unchanged. |
| AC-48 | Every F-08 endpoint returns 403 for another user's account and for an Administrator, and 401 without a session, with no account data in the body. |
| AC-48-UI | The Accounts screen creates, renames, archives, restores and deletes accounts and shows each server error message. Verified in Issue 06. |

## Test specification

API tests run with Vitest and Supertest against PostgreSQL, in `server/tests/f08-account-management.api.test.ts`. The client test is in `client/tests/`.

| Test | Level | AC | Preconditions and input | Expected result |
|---|---|---|---|---|
| TEST-33 | API/DB | AC-41 | Signed-in user A. Create `CASH/WALLET`, `LOAN_GIVEN/OTHER`, `LOAN_TAKEN/OTHER`, `INCOME/OTHER` and `EXPENSE/OTHER` accounts. | Each returns 201. `GET /api/accounts` lists all of them with `openingBalance` `"0"` and `archivedAt` `null`. |
| TEST-34 | API/DB | AC-42 | Invalid inputs: type `"SAVINGS"`; `CASH` + `CREDIT_CARD`; name `"  "`; a 61-character name. | 400 with the specified message for each. The account count is unchanged. |
| TEST-35 | API/DB | AC-43 | A has `"Wallet"`. A creates `"wallet"`; user B creates `"Wallet"`. | A gets 409. B gets 201. |
| TEST-36 | API/DB | AC-44 | A renames an owned account to `"Main bank"`, then sends `{ "type": "EXPENSE" }`. | The rename returns 200 and persists. The type change returns 400, with type unchanged. |
| TEST-37 | API/DB | AC-45 | A has a new wallet with balance 0. Archive it, list accounts, try a receipt into it, then restore it. | Archive 200 with `archivedAt` set. The default list excludes it and `?includeArchived=true` includes it. The receipt returns 400 `"This account is archived."`. Restore returns 200. |
| TEST-38 | API/DB | AC-46 | Bank balance 500.00 (opening balance). Archive it. | 409 `"Only an account with a zero balance can be archived."`, and `archivedAt` stays `null`. |
| TEST-39 | API/DB | AC-47 | An unused new expense account, and the seeded bank account used by a salary receipt. Delete both. | 204, then 404 on re-fetch, for the first. 409 for the second, which still exists. |
| TEST-40 | API/DB | AC-48 | User B and an Administrator call every F-08 endpoint on A's account. A call with no token. | B gets 403, the Administrator gets 403, no token gets 401. Bodies contain only `error`. |
| TEST-41 | Client | AC-48-UI | Accounts screen with mocked API. Create, rename, archive, then delete returning 409. | The list updates after each success. The 409 message is shown next to the delete action. |

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature), plus:

- The migration is applied by `prisma migrate deploy` on a fresh database and on a copy holding Sprint 1 data.
- The seeded accounts still exist for new and registered users (F-07 unchanged).
- TEST-33 to TEST-40 pass on the Issue 02 branch, and TEST-41 passes in Issue 06.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract. | #73 |
