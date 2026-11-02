# F-01 Authentication and Role Access

## Contract

Seed one `USER` and one `ADMINISTRATOR` account. Authenticate with email and password, store only a salted scrypt password hash, and issue a random bearer session token. Persist only the token hash and expiry. Sessions expire after seven days, following the Lab authentication precedent, and logout revokes the presented token.

## API and data

- `POST /api/auth/login`: active account credentials produce a bearer token, expiry timestamp, and safe identity; invalid credentials return the same generic 401 response.
- `POST /api/auth/logout`: revoke the presented token and return 204.
- `GET /api/auth/me`: return the authenticated user's safe identity.
- `GET /api/admin/users`: administrator-only list without password hashes.
- `PATCH /api/admin/users/:userId/status`: administrator-only enable/disable operation.
- `User` stores name, normalized email, password hash, role, and enabled state. `AuthSession` stores token hash, user, and expiry.

## Access rules

- `USER` is limited to its own financial endpoints.
- `ADMINISTRATOR` may manage user enabled state but cannot access financial endpoints.
- Protected API routes require a valid, unexpired bearer token and an enabled user.

## Acceptance criteria and verification

| AC | Verification |
|---|---|
| AC-01 valid credentials create an authenticated session | API login test checks token and expiry; `/auth/me` returns safe identity. |
| AC-02 invalid credentials are rejected without sensitive detail | Wrong-password and unknown-user responses are identical. |
| AC-03 unauthenticated protected request is rejected | Administrator users request without bearer token returns 401. |
| AC-04 current-user returns authenticated identity | Authenticated `/auth/me` returns safe identity. |
| AC-05 logout ends the session | Token is rejected after logout. |
| AC-06 administrator can enable/disable a platform user | Admin status API test disables and re-enables a user. |
| AC-07 disabled user cannot access financial operations | Existing session and new login are rejected while disabled. |

Additional test coverage checks session expiry, administrator-only access, and the UI login, current-user, and logout flows.

## Definition of Done

UI and API login/logout/current-user behavior, password hashing, session expiry/revocation, role checks, and automated tests must pass on the reviewed candidate commit.
