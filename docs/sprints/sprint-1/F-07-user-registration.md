# F-07 User Registration

## Purpose

Allow a new person to create a normal user account, receive the standard Sprint 1 financial accounts, and then sign in manually.

## Agreed rules

- Registration creates only a `USER`; the registrant cannot choose `ADMINISTRATOR`.
- Name and email are required.
- Email is normalized to lowercase and must be unique.
- Password must be at least 8 characters, contain at least one capital letter, and contain at least one special character.
- Passwords are stored only as scrypt hashes.
- New users are enabled by default.
- Registration creates Bank Account, Credit Card, Salary, Dining, and Groceries accounts.
- Registration does not create a session automatically.
- A successful registration shows a notification and returns the user to sign in.
- Invalid and duplicate registrations create no partial records.

## API

`POST /api/auth/register`

Success: `201` with the safe user identity. Duplicate email: `409`. Invalid input: `400`.

## Acceptance criteria

| ID | Requirement | Verification |
|---|---|---|
| F07-AC-01 | A person can register as a normal user. | Registration API and UI test |
| F07-AC-02 | Weak passwords are rejected using the agreed rules. | Validation tests |
| F07-AC-03 | Duplicate emails are rejected without a second user. | Database/API test |
| F07-AC-04 | Administrator role cannot be selected during registration. | API payload and persisted role test |
| F07-AC-05 | Standard financial accounts are created for the new user. | Persistence test |
| F07-AC-06 | Registration does not create a session; the user must log in again. | API/UI test |
| F07-AC-07 | Registration failures do not create partial user/account records. | Database count test |

## Definition of Done

Registration API, UI, validation, password hashing, automatic account setup, duplicate handling, tests, and documentation pass review without changing the existing seeded administrator workflow.
