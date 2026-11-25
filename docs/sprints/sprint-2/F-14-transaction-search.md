# F-14 Transaction Search and Filtering

**Contract version:** 1.0 (Sprint 2, Issue 00 / #73). Implementation: Issue 05, branch `SP2-05-F14-transaction-search`.
**Shared rules:** [Sprint 2 README](README.md) §5–§7. Depends on F-08 (archived accounts) and the `note` field from Issue 01.

## Purpose and scope

An authenticated `USER` can find their own transactions by date, account, type, amount and note, with paginated results. The Sprint 1 `GET /api/transactions` returns the full list and stays unchanged, so the Sprint 1 client and tests keep working. Search gets its own endpoint (D-9).

Out of scope: saved searches, CSV export and full-text ranking.

## API

`GET /api/transactions/search` (new). Every parameter is optional.

| Parameter | Format | Meaning |
|---|---|---|
| `from`, `to` | `YYYY-MM-DD` | Inclusive transaction-date range |
| `accountId` | positive integer | The account is the source, the receiving account, or any allocation-line account |
| `formType` | `PAYMENT_OR_CHARGE` \| `RECEIVE_MONEY` | Form type |
| `allocationType` | Any `AllocationType` | At least one line of that type |
| `minAmount`, `maxAmount` | Amount rule (README §5) | Inclusive range on `totalAmount` |
| `q` | 1–100 characters after trimming | Case-insensitive *contains* match on `note` |
| `page` | integer ≥ 1, default 1 | Page number |
| `pageSize` | integer 1–100, default 20 | Page size |

Filters combine with AND. Results are ordered by `transactionDate` descending, then `id` descending, the same as Sprint 1 history.

Response 200:

```json
{ "items": [ <transaction>, ... ], "page": 1, "pageSize": 20, "total": 37 }
```

`items` uses the shared transaction shape, including `note` and `updatedAt`.

Errors (400):

| Case | Message |
|---|---|
| Malformed parameter | `"Invalid search parameter: <name>."` |
| `from` later than `to` | `"The start date must not be after the end date."` |
| `minAmount` above `maxAmount` | `"The minimum amount must not be above the maximum amount."` |

Access: no session → 401; Administrator → 403.

## Business rules

- **Owner scope (D-9):** the query always includes `ownerUserId = session user`. A request with another user's `accountId` returns `200 { items: [], total: 0 }`, which does not reveal that the account exists.
- Archived accounts are searchable, so their history stays reachable.
- A page beyond the end returns `items: []` with the correct `total`.

## Data

No schema change. The existing index `Transaction(ownerUserId, transactionDate)` supports the default order. The note match uses Prisma `contains` with `mode: "insensitive"`.

## UI (implemented in Issue 06)

The **History** screen has a filter bar (date range, account, type, amount range, note text, Clear), a result count, and Previous/Next paging. Invalid input shows the server's 400 message. An empty result shows "No transactions match these filters."

## Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-83 | With no parameters, search returns the user's transactions newest first, in pages of 20, with the correct `total`. |
| AC-84 | Each filter returns exactly the matching transactions: date range (inclusive edges), account (source, receiving or line), form type, allocation type, amount range (inclusive edges) and note text (case-insensitive). |
| AC-85 | Combined filters apply together (AND). |
| AC-86 | Paging returns disjoint pages that together cover the result, in order. A page past the end is empty with the correct `total`. |
| AC-87 | Invalid parameters, `from` after `to`, and `minAmount` above `maxAmount` return 400. |
| AC-88 | User A never receives User B's transactions, including when filtering by User B's `accountId`, which returns an empty result. An Administrator gets 403 and no session gets 401. |
| AC-89 | `GET /api/transactions` (Sprint 1) is unchanged. |
| AC-89-UI | The History filter bar, paging and empty state work against the API. Verified in Issue 06. |

## Test specification

File `server/tests/f14-transaction-search.api.test.ts`. Seed for user A: 25 transactions across Nov 1–25, 2026, covering every form and line type, with amounts from 10.00 to 2,500.00 and some notes ("ATM", "Lunch with team", "lunch"), plus one involving an archived wallet. User B: 5 transactions, one with the note "Lunch".

| Test | Level | AC | Input | Expected result |
|---|---|---|---|---|
| TEST-78 | API/DB | AC-83 | `GET /api/transactions/search` | 200 with 20 items, `total` 25, ordered by date then id descending. Only A's records. |
| TEST-79 | API/DB | AC-84 | `from=2026-11-10&to=2026-11-10`, plus each other filter in turn. | Each result equals the expected set computed from the seed. The date and amount edges are included. `q=lunch` matches both A notes and none of B's. |
| TEST-80 | API/DB | AC-84 | `accountId=<wallet>`, where the wallet is the source in one transaction, the receiving account in another, and a `TRANSFER` line in a third. | All three are returned. |
| TEST-81 | API/DB | AC-85 | `formType=PAYMENT_OR_CHARGE&allocationType=EXPENSE&minAmount=100&q=lunch` | Exactly the intersection. |
| TEST-82 | API/DB | AC-86 | `pageSize=10` for pages 1, 2, 3 and 4. | Pages of 10, 10, 5 and 0. No duplicates. The order matches TEST-78. `total` is always 25. |
| TEST-83 | API/DB | AC-87 | `from=2026-13-01`, `pageSize=0`, `pageSize=101`, `minAmount=abc`, `from` after `to`, `minAmount` > `maxAmount`, and a 101-character `q`. | 400 with the specified messages. |
| TEST-84 | API/DB | AC-88 | A filters by B's `accountId`. An Administrator searches. No token. | `items: []`, `total: 0`, then 403, then 401. |
| TEST-85 | API/DB | AC-89 | `GET /api/transactions` | The same array shape and content as the existing f05 and f06 history assertions. Those tests pass unchanged. |

## Definition of Done

[Shared Sprint 2 DoD](README.md#7-sprint-2-definition-of-done-applies-to-every-feature). TEST-78 to TEST-85 pass.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | 2026-11-25 | First contract (D-9). | #73 |
