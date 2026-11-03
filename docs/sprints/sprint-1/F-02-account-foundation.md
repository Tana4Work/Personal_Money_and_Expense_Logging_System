# F-02 Personal Account Foundation

## Purpose and scope

Provide private, typed financial accounts for each user. F-02 adds the account model, initial seeded accounts, authenticated account retrieval through the API and UI, and backend ownership enforcement.

F-02 does not add the opening-balance form or transaction behavior; those belong to F-03 and later features.

## Account model

Each account has an ID, owner user, name, type, subtype, opening balance, and creation timestamp. The owner is a required relationship to `User`.

Account types follow `GLOSSARY.md`: `CASH`, `LOAN_GIVEN`, `LOAN_TAKEN`, `INCOME`, and `EXPENSE`. Subtypes follow the suggested values in `PROJECT_PLAN.md`: `BANK`, `WALLET`, `CREDIT_CARD`, and `OTHER`.

## Seeded accounts

Seed the following accounts for the enabled demo `USER`. The demo `ADMINISTRATOR` does not receive financial accounts.

| Name | Type | Subtype | Initial opening balance |
|---|---|---|---:|
| Bank Account | `CASH` | `BANK` | 0 |
| Credit Card | `LOAN_TAKEN` | `CREDIT_CARD` | 0 |
| Salary | `INCOME` | `OTHER` | 0 |
| Dining | `EXPENSE` | `OTHER` | 0 |
| Groceries | `EXPENSE` | `OTHER` | 0 |

These balances are model defaults only. Recording or changing an opening balance is outside F-02.

## API and access

- `GET /api/accounts` returns the authenticated user's accounts.
- `GET /api/accounts/:accountId` returns one account owned by the authenticated user.
- Both routes require a valid, unexpired session for an enabled `USER`.
- An unauthenticated request receives `401`.
- An `ADMINISTRATOR` receives `403` and is not given financial account data.
- Account ownership is derived from the authenticated session, never from a user ID supplied by the client.
- A request for another user's existing account receives `403` without account data. A nonexistent account receives `404`.

## UI

The authenticated `USER` view lists the user's account name, type, and subtype. The administrator view continues to show only user-access controls and does not request or display accounts.

## Acceptance criteria and verification

| AC | Verification |
|---|---|
| AC-08 user retrieves own accounts | Authenticated account list contains only accounts owned by that user. |
| AC-09 user cannot retrieve another user's account | A cross-owner detail request is rejected with `403` and returns no account data. |
| AC-10 type and subtype persist | Database records retain the approved account type/subtype mapping. |
| AC-11 ownership is enforced by backend | API derives owner identity from the authenticated session; client-supplied owner IDs do not control results. |

Required tests:

- Account migration and seeded account records.
- Account type and subtype persistence.
- User A lists only User A's accounts.
- User A cannot retrieve User B's account.
- An empty account list is returned when a user owns no accounts.
- Unauthenticated and administrator account requests are rejected.
- The UI displays a user's accounts and does not load accounts for an administrator.

## Definition of Done

The account model and migration are applied; the five seeded accounts are available to the demo user; the API and UI retrieve only the authenticated user's accounts; required ownership, role, and persistence tests pass; and the teammate reviews the F-02 pull request.
