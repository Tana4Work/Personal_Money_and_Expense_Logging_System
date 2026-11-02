# F-01 Authentication and Role Access

Seed one `USER` and one `ADMINISTRATOR`. Hash local passwords with salted scrypt; issue random bearer tokens and store only token hashes. Sessions expire after seven days and logout revokes the presented token.

## API and access

- `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` provide login, revocation, and safe identity.
- `GET /api/admin/users` and `PATCH /api/admin/users/:userId/status` are administrator-only list and enable/disable operations.
- Protected routes require a valid, unexpired session for an enabled user. `USER` accesses personal financial routes; `ADMINISTRATOR` has no financial access.
- `User` stores name, normalized email, password hash, role, and enabled state. `AuthSession` stores token hash, user, and expiry.

## Acceptance criteria and verification

| AC | Verification |
|---|---|
| AC-01 valid login | API returns a token and expiry; `/auth/me` returns safe identity. |
| AC-02 invalid login | Unknown user and wrong password receive the same response. |
| AC-03 unauthenticated protected request | Administrator users request returns 401 without a token. |
| AC-04 current-user | Authenticated `/auth/me` returns identity. |
| AC-05 logout | Revoked token is rejected. |
| AC-06 administrator status change | Admin can disable and re-enable a user. |
| AC-07 disabled user | Existing sessions and new login are rejected. |

Tests also cover expiry, role access, and UI login/current-user/logout.

## Definition of Done

UI and API auth flows, hashing, expiry/revocation, role checks, and automated tests pass on the reviewed commit.
