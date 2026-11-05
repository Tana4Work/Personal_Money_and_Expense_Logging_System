# Personal Money and Expense Logging System

## Agent handoff

This document is the working source of truth for the group project. Read it before changing requirements, data models, APIs, UI, tests, branches, or project documents.

### Current decisions

- Theme: Personal Money and Expense Logging System.
- Product scope: use the complete topic brief from the course specification.
- Sprint 1: implement the required opening-balance, salary, split credit-card purchase, repayment, summary, and history journey.
- Sprint 1 implementation size: six features, listed below.
- Technology: reuse the stack used in the individual Labs 1-4.
- Authentication working default: seeded accounts with server-managed sessions, unless the existing stack makes a secure token design more practical.
- Transaction working default: one transaction has a form type, a source or receiving account, a total amount, and one or more allocation lines.
- Database: persistent relational or document database supported by the existing project stack; data must survive restart.
- Demo data: synthetic only.

If a change conflicts with this plan, record the reason in the change log and update the relevant requirement, feature, contract, test, and traceability entries together.

## Course constraints

Deliverable 1 is an 80-point submission due 8 November 2026 at 23:59. It requires the complete product baseline in the documents, but only the Sprint 1 vertical slice must be working at this checkpoint.

The Sprint 1 release must have:

1. UI -> API/application layer -> persistent database behavior.
2. Login, logout, current-user identity, and at least two meaningful roles.
3. A meaningful financial transaction and business-rule validation.
4. Automated domain, persistence, and access tests, plus selected UI/end-to-end checks.
5. GitHub Issues, feature branches, teammate-reviewed pull requests, sprint staging/integration, and an accepted release on `main`.

Docker, GCP deployment, completed CI/CD, and a demo video belong to later checkpoints/labs, not this Deliverable 1 release.

## Product definition

The platform lets multiple users privately track money, bank and wallet balances, credit-card spending, personal loans, income, expenses, summaries, and transaction history.

### Account types

The product supports these five account types:

| Type | Meaning | Examples |
|---|---|---|
| `CASH` | Money currently held by the user | Wallet, bank account |
| `LOAN_GIVEN` | Money owed to the user | Personal loan given to another person |
| `LOAN_TAKEN` | Money owed by the user | Credit card, borrowed money |
| `INCOME` | Income categories | Salary, interest earned |
| `EXPENSE` | Expense categories | Dining, groceries, electricity, telecom |

### Transaction forms

#### Make a payment or record a charge

Select a cash, bank, credit-card, or other loan-taken account used for the transaction. Allocate the total to one or more of:

- Expense accounts.
- Repayment of a loan taken.
- Loan given to someone.
- Transfer to another cash or bank account.

#### Receive money

Select the cash or bank account receiving the money. Allocate the total to one or more of:

- Income accounts.
- Repayment of a loan given.
- New borrowing from a loan-taken account.
- Transfer from another cash or bank account.

### Explicit exclusions

These are outside the current baseline scope:

- Period budgets.
- Shared budgets.
- Automatic recurring transactions.
- Bank integration.
- Real payment gateways.
- External messaging services.
- External financial APIs.

## Sprint plan

### Sprint 1: required working vertical slice

Features: `F-01` through `F-06`.

Outcome: a user can authenticate, use seeded financial accounts, record an opening balance, receive salary, record a split credit-card purchase, repay the card, and retrieve correct balances, debt, summaries, and history.

### Sprint 2: core expansion

Recommended features:

- Create and manage all five account types.
- Wallet and bank-account management.
- Loan Given workflows.
- Loan Taken and borrowing workflows.
- Loan repayments beyond the Sprint 1 card repayment.
- Transfers.
- Improved opening-balance management.
- Transaction corrections.
- Transaction search and filtering.

### Sprint 3: remaining product behavior and hardening

Recommended features:

- Favorite transactions.
- Favorite-transaction list.
- Duplicate transaction as an editable draft.
- Category spending summaries.
- Income and expense reports.
- Regression fixes, validation improvements, and release hardening.

The exact Sprint 2 and Sprint 3 allocation may change, but every baseline requirement must remain mapped to a feature, sprint, acceptance criterion or verification target, test, and status.

### Follow-up feature F-07: User registration

F-07 is a post-Sprint-1 follow-up on branch `SP1-F07-user-registration`. It adds self-registration for normal `USER` accounts without changing the six-feature Sprint 1 boundary. Registration requires a name, unique email, and a password with at least 8 characters, one capital letter, and one special character. New users receive the standard Bank Account, Credit Card, Salary, Dining, and Groceries accounts. Registration returns a success notification and requires the user to sign in manually; it does not create a session automatically. Administrator accounts remain seed/admin controlled.

## Sprint 1 feature plan

### F-01 Authentication and role access

**Purpose:** establish identity and backend authorization.

**Primary owner:** Partner A. **Reviewer:** Partner B.

**Branch:** `feature/auth-role-access`

**Includes:**

- Seeded normal-user and administrator accounts.
- Login.
- Logout.
- Current-user endpoint or equivalent.
- Password hashing when local passwords are used.
- Session/token creation and expiry behavior.
- User and Administrator roles.
- Administrator enable/disable operation.
- Disabled-user rejection.

**Acceptance criteria:**

- `AC-01`: valid credentials create an authenticated session.
- `AC-02`: invalid credentials are rejected without revealing sensitive details.
- `AC-03`: a protected request without authentication is rejected.
- `AC-04`: current-user returns the authenticated identity.
- `AC-05`: logout ends the authenticated session.
- `AC-06`: an administrator can enable or disable a platform user.
- `AC-07`: a disabled user cannot access protected financial operations.

**Tests:** valid login, invalid login, unauthenticated API request, current-user, logout, disabled-user access, administrator role access.

**Done when:** login/logout/current-user work through the UI and API, password/session behavior is documented, backend role checks are tested, and the teammate has reviewed the PR.

### F-02 Personal account foundation

**Purpose:** provide private, typed financial accounts for each user.

**Primary owner:** Partner B. **Reviewer:** Partner A.

**Branch:** `feature/account-foundation`

**Includes:**

- User-owned Account entity.
- Account type and subtype.
- Seeded bank account.
- Seeded credit-card account.
- Seeded salary income account.
- Seeded dining and grocery expense accounts.
- Account list/retrieval UI and API.
- Backend ownership filtering.

**Acceptance criteria:**

- `AC-08`: a user can retrieve their own accounts.
- `AC-09`: a user cannot retrieve another user's accounts.
- `AC-10`: account type and subtype are persisted correctly.
- `AC-11`: account queries enforce ownership on the backend, not only in the UI.

**Tests:** account persistence, account type validation, cross-user account access, empty account response, account ownership query.

**Done when:** seeded accounts are usable by the Sprint 1 journey and cross-user access is rejected by an API/integration test.

### F-03 Opening balance and balance calculation

**Purpose:** establish the initial bank balance and durable balance calculation.

**Primary owner:** Partner B. **Reviewer:** Partner A.

**Branch:** `feature/opening-balance`

**Depends on:** `F-01`, `F-02`.

**Acceptance criteria:**

- `AC-12`: an authenticated user can record an opening bank balance.
- `AC-13`: the opening balance is persisted.
- `AC-14`: the balance remains after refresh, re-login, or application restart.
- `AC-15`: the opening balance is not counted as income or expense.
- `AC-16`: invalid amounts and invalid account types are rejected.

**Tests:** opening-balance API/database integration, restart persistence, invalid amount, summary classification.

**Done when:** the initial balance is visible from a fresh read and has a documented calculation rule.

### F-04 Receive money

**Purpose:** record salary or other income received into a bank account.

**Primary owner:** Partner A. **Reviewer:** Partner B.

**Branch:** `feature/receive-money`

**Depends on:** `F-01`, `F-02`, `F-03`.

**Acceptance criteria:**

- `AC-17`: a user can record salary received into their bank account.
- `AC-18`: the receiving bank balance increases correctly.
- `AC-19`: the income summary increases correctly.
- `AC-20`: the transaction and allocation line are persisted.
- `AC-21`: invalid amount, date, or account combination is rejected.
- `AC-22`: a user cannot record income into another user's account.

**Tests:** salary integration test, balance calculation, income summary, persistence, invalid input, ownership restriction.

**Done when:** salary can be recorded from the UI and retrieved later with the correct bank balance and income summary.

### F-05 Payment/charge with split allocation

**Purpose:** record a credit-card purchase allocated across multiple expense categories.

**Primary owner:** Partner B. **Reviewer:** Partner A.

**Branch:** `feature/split-payment`

**Depends on:** `F-01`, `F-02`.

**Acceptance criteria:**

- `AC-23`: a user can record a credit-card purchase.
- `AC-24`: a purchase can have dining and grocery allocation lines.
- `AC-25`: allocation lines must equal the transaction total.
- `AC-26`: a mismatched allocation total is rejected and no transaction is stored.
- `AC-27`: credit-card debt increases by the purchase total.
- `AC-28`: dining and grocery category totals update correctly.
- `AC-29`: the purchase is visible in transaction history.

**Tests:** valid split purchase, allocation mismatch, zero/negative amount, debt calculation, expense summary, database rollback/no partial write, ownership restriction.

**Done when:** the API rejects invalid allocations atomically and the UI shows the saved split purchase.

### F-06 Credit-card repayment and financial overview

**Purpose:** complete the required financial journey and show its results.

**Primary owners:** Partner A and Partner B together.

**Branch:** `feature/credit-card-repayment`

**Depends on:** `F-01` through `F-05`.

**Acceptance criteria:**

- `AC-30`: a user can repay credit-card debt from their bank account.
- `AC-31`: repayment decreases credit-card debt correctly.
- `AC-32`: repayment decreases the bank balance correctly.
- `AC-33`: repayment is not counted as income or expense.
- `AC-34`: the overview shows bank balance, card debt, income, expenses, and history.
- `AC-35`: the full journey can be completed and then retrieved from persisted data.
- `AC-36`: repayment cannot be made using another user's account.

**Tests:** repayment integration test, debt/bank balance calculation, classification exclusion, full end-to-end journey, persisted retrieval, cross-user repayment rejection.

**Done when:** the complete Sprint 1 journey passes from a clean seeded database and the final values are shown in the PDF evidence.

## Financial calculation example

Use synthetic values such as:

```text
Opening bank balance       +10,000
Salary received            +30,000
Bank balance before card repayment 40,000

Credit-card purchase:
  Dining                     800
  Groceries                1,200
  Total card purchase       2,000
  Credit-card debt          2,000

Credit-card repayment      2,000
Final bank balance        38,000
Final credit-card debt         0
Income summary            30,000
Expense summary            2,000
```

The actual synthetic amounts may differ, but all balance and classification rules must remain correct.

## Suggested data model

```text
User
- id
- username or email
- password_hash
- role: USER | ADMINISTRATOR
- enabled

Account
- id
- owner_user_id
- name
- type: CASH | LOAN_GIVEN | LOAN_TAKEN | INCOME | EXPENSE
- subtype: BANK | WALLET | CREDIT_CARD | OTHER
- opening_balance
- created_at

Transaction
- id
- owner_user_id
- form_type: PAYMENT_OR_CHARGE | RECEIVE_MONEY
- source_account_id, nullable when receiving money
- receiving_account_id, nullable when making a payment
- total_amount
- transaction_date
- created_at

AllocationLine
- id
- transaction_id
- account_id
- allocation_type
- amount
```

Use database constraints and application validation together. A transaction must never be partially stored when validation fails.

## Role and ownership matrix

| Operation | User | Administrator |
|---|---|---|
| Login/logout/current-user | Own identity | Own identity |
| View own accounts | Yes | No financial access |
| View another user's accounts | No | No |
| Create own transaction | Yes | No, unless the administrator is also explicitly modeled as a normal user |
| View own transactions | Yes | No |
| View another user's transactions | No | No |
| View own summaries | Yes | No |
| View another user's summaries | No | No |
| Enable/disable platform users | No | Yes |
| Modify financial records | Own records only | No |

Every ownership check must use the authenticated user identity on the server. Never trust a user ID or role selected by the client.

## API plan

Adapt names to the existing stack, but preserve the behavior:

```text
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /accounts
GET    /accounts/:accountId
POST   /accounts/:accountId/opening-balance

POST   /transactions/receive
POST   /transactions/payment
POST   /transactions/repayment
GET    /transactions
GET    /transactions/:transactionId

GET    /summaries
GET    /summaries/balances

GET    /admin/users
PATCH  /admin/users/:userId/status
```

Protected responses must use the project's normal error format. At minimum distinguish authentication failure, authorization failure, validation failure, not-found, and conflict/business-rule rejection.

## Test matrix

At minimum, retain these tests in the final release:

| Test ID | Area | Expected result |
|---|---|---|
| TEST-01 | Valid login | Session created |
| TEST-02 | Invalid login | Rejected |
| TEST-03 | Unauthenticated accounts request | Rejected without private data |
| TEST-04 | User A requests User B account | Rejected |
| TEST-05 | Administrator requests financial data | Rejected |
| TEST-06 | Opening balance persistence | Value survives restart/re-read |
| TEST-07 | Salary received | Bank balance and income increase |
| TEST-08 | Split purchase | Expense lines and card debt correct |
| TEST-09 | Allocation mismatch | Rejected with no partial write |
| TEST-10 | Card repayment | Card debt and bank balance correct |
| TEST-11 | Full UI journey | Complete journey succeeds |
| TEST-12 | Logout | Protected request no longer works |

## Documentation files to create

```text
docs/srs.md
docs/features.md
docs/traceability.md
docs/system-sds.md
docs/sprints/plan.md
docs/sprints/sprint-1/F-01-auth-role-access.md
docs/sprints/sprint-1/F-02-account-foundation.md
docs/sprints/sprint-1/F-03-opening-balance.md
docs/sprints/sprint-1/F-04-receive-money.md
docs/sprints/sprint-1/F-05-split-payment.md
docs/sprints/sprint-1/F-06-repayment-overview.md
docs/decisions/change-log.md
```

## Deliverable 1 PDF structure

The PDF must contain Parts A-F in this order:

1. **Part A:** complete SRS, actors, scope, exclusions, FR/BR/NFR, assumptions, decisions.
2. **Part B:** feature inventory and requirement-to-feature-to-sprint traceability.
3. **Part C:** System-Level SDS, architecture, data model, UI/API conventions, access, authentication, configuration, deployment plan.
4. **Part D:** three-sprint plan with goals, dependencies, feature IDs, and outcomes.
5. **Part E:** all six Sprint 1 contracts, AC, STS, and Definition of Done.
6. **Part F:** screenshots, build/test output, AC-to-test table, test excerpts, TDD evidence, Issues/PRs, contribution table, AI-use declaration, limitations, repository URL, and release commit.

The first pages must include both students' names and IDs, topic/context, repository URL, release tag/commit, and a navigation table with PDF page ranges for Parts A-F.

## Definition of Done

A feature is done only when all of the following are true:

- Requirement and acceptance-criterion IDs are linked.
- UI, API, and persistence behavior are implemented where applicable.
- Validation, boundary cases, and authorization are implemented.
- Automated tests exist at the appropriate unit/API/database/UI levels.
- Tests have actually run on the candidate commit.
- Required tests pass, and failures/skips are disclosed.
- The teammate reviewed the PR with a meaningful comment or check.
- The feature is integrated into `sprint-1`.
- Integration tests pass.
- Setup and seed instructions are current.
- Evidence exists for the final PDF.

## Git and collaboration rules

1. Start work from the latest `sprint-1` branch.
2. Open or update the Issue before implementation.
3. Record the contract and test design before implementation when practical.
4. Use a bounded feature branch.
5. Write meaningful commits.
6. Open a PR into `sprint-1`.
7. The author does not approve their own PR.
8. The teammate records a substantive review.
9. Run integration tests after merging.
10. Merge the accepted release into `main` and record the immutable release commit/tag.

## Partner AI instructions

When working on this project:

1. Read this file first.
2. Inspect the existing repository before proposing new files or dependencies.
3. Preserve the six-feature Sprint 1 boundary unless the students explicitly approve a change.
4. Use the existing Lab 1-4 stack.
5. Keep requirement, feature, acceptance-criterion, test, branch, and evidence IDs stable.
6. Enforce ownership and roles in the backend.
7. Prefer a small vertical slice over unrelated UI or CRUD expansion.
8. Update the relevant contract and traceability entry when behavior changes.
9. Never claim a feature is complete without running its tests.
10. Report incomplete, failed, skipped, or uncertain work explicitly.
11. Do not add real secrets, real financial data, or unnecessary external integrations.
12. Before finishing, report changed files, commands run, test results, remaining risks, and the next bounded task.

## Change log

| Date | Change | Reason | Approved by |
|---|---|---|---|
| 2026-11-02 | Consolidated Sprint 1 into six features | Keep the required vertical slice manageable for a two-person team | Team |

