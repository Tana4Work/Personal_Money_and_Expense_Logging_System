# Deliverable 1 and Sprint 1 Execution Plan

This is the execution checklist for the Personal Money and Expense Logging System. The master scope and domain rules are in `PROJECT_PLAN.md`. This file answers: what do we do first, who owns it, what must be reviewed, and what evidence must be ready for submission.

## Target release

- Submission: Deliverable 1 PDF plus repository release.
- Deadline: 8 November 2026 at 23:59.
- Release branch: `main`.
- Integration branch: `sprint-1`.
- Release identifier: create an immutable tag such as `deliverable-1-sprint-1` after the final accepted commit.
- Working stack: reuse the stack from Labs 1-4.

## Definition of success

From a clean seeded environment, the team can demonstrate this complete journey:

```text
User logs in
→ sees only their own seeded accounts
→ records an opening bank balance
→ receives salary into the bank account
→ records a credit-card purchase split between Dining and Groceries
→ repays the credit card from the bank account
→ sees correct balances, debt, income, expenses, and history
→ refreshes/restarts and retrieves the same persisted results
→ logs out
```

The backend also demonstrates that:

- unauthenticated requests are rejected;
- User A cannot access User B's records;
- an Administrator cannot access financial records;
- allocation lines must equal the transaction total;
- invalid operations do not create partial database records.

## Team split

The split is ownership, not a permanent role division. Both students must design, implement, test, review, and explain the released product.

| Work | Primary | Reviewer or pair work | Output |
|---|---|---|---|
| F-01 Authentication and roles | Partner A | Partner B | Auth feature, API tests, access evidence |
| F-02 Account foundation | Partner B | Partner A | Account model, seed data, ownership tests |
| F-03 Opening balance | Partner B | Partner A | Opening-balance flow and persistence tests |
| F-04 Receive money | Partner A | Partner B | Salary flow and income calculations |
| F-05 Split payment | Partner B | Partner A | Split purchase and allocation validation |
| F-06 Repayment and overview | Both | Both | Integrated journey, summaries, history |
| SRS and traceability | Partner A | Partner B | `docs/srs.md`, `docs/features.md`, `docs/traceability.md` |
| SDS and data model | Partner B | Partner A | `docs/system-sds.md` |
| Three-sprint plan | Partner A | Partner B | `docs/sprints/plan.md` |
| Feature contracts | Each owns their features | Both review every contract | Six contract files |
| Final PDF and evidence | Both | Both | One self-contained PDF |

## Ordered implementation sequence

### Phase 0: baseline and agreement

**Owner:** both students.

1. Read `PROJECT_PLAN.md` and this file.
2. Confirm the existing Lab 1-4 stack and repository commands.
3. Create or confirm the `sprint-1` branch.
4. Create six Issues: `F-01` through `F-06`.
5. Record the requirements and acceptance criteria before implementation.
6. Confirm the database migration and seed strategy.
7. Confirm the test account identities without putting real passwords in Git.

**Completion evidence:** an Issue/feature table, branch plan, initial contracts, and a reproducible local setup command.

### Phase 1: identity and data foundation

#### F-01 Authentication and role access

Implement:

- seeded `USER` and `ADMINISTRATOR` accounts;
- password hashing if local passwords are used;
- login, logout, and current-user behavior;
- session/token expiry and invalidation;
- enabled/disabled account status;
- backend role checks.

Required tests:

- valid login;
- invalid login;
- current user;
- logout;
- unauthenticated protected request;
- disabled user;
- Administrator financial-record rejection.

#### F-02 Account foundation

Implement:

- User ownership link;
- account type and subtype;
- bank account;
- credit-card account;
- salary income account;
- dining expense account;
- grocery expense account;
- account retrieval through the API and UI.

Required tests:

- account seed/migration;
- account type persistence;
- User A cannot retrieve User B's accounts;
- all account queries use authenticated ownership.

**Integration gate:** log in as the seeded user and retrieve the correct accounts. Log in as another user and confirm the first user's accounts are not returned.

### Phase 2: required financial journey

#### F-03 Opening balance

Implement:

- opening-balance form/API;
- amount and date validation;
- balance persistence;
- classification as neither income nor expense.

Required tests:

- valid opening balance;
- invalid amount;
- persistence after re-read or restart;
- summary exclusion.

#### F-04 Receive money

Implement:

- receive-money form/API;
- bank/cash receiving-account validation;
- income allocation;
- salary transaction history;
- bank balance and income summary calculation.

Required tests:

- valid salary transaction;
- bank balance increase;
- income summary increase;
- invalid account combination;
- invalid amount;
- cross-user rejection.

#### F-05 Split payment/charge

Implement:

- payment/charge form/API;
- credit-card source account;
- multiple allocation lines;
- Dining and Groceries categories;
- exact allocation-total validation;
- credit-card debt calculation;
- expense summary calculation.

Required tests:

- valid split purchase;
- allocation total mismatch;
- zero or negative amount;
- credit-card debt increase;
- category summary calculation;
- no partial write after rejection;
- cross-user rejection.

#### F-06 Credit-card repayment and overview

Implement together:

- repayment form/API;
- bank source account;
- credit-card liability destination;
- debt reduction;
- bank balance reduction;
- exclusion from income and expense summaries;
- account overview;
- transaction history;
- persisted retrieval.

Required tests:

- valid repayment;
- debt reduction;
- bank balance reduction;
- repayment classification exclusion;
- invalid account combination;
- cross-user rejection;
- complete end-to-end journey.

**Integration gate:** run the entire journey from a clean seed and compare every final number with the expected calculation.

## Suggested test data

Use synthetic values such as:

```text
Opening bank balance: 10,000
Salary: 30,000
Dining allocation: 800
Groceries allocation: 1,200
Credit-card purchase: 2,000
Credit-card repayment: 2,000

Expected final bank balance: 38,000
Expected final credit-card debt: 0
Expected income summary: 30,000
Expected expense summary: 2,000
```

The implementation may use different values, but the expected values must be written down before running the demonstration.

## Branch and pull-request plan

```text
feature/auth-role-access        → PR → sprint-1
feature/account-foundation     → PR → sprint-1
feature/opening-balance        → PR → sprint-1
feature/receive-money          → PR → sprint-1
feature/split-payment          → PR → sprint-1
feature/credit-card-repayment  → PR → sprint-1
sprint-1                       → release PR → main
```

Each PR must contain:

- linked Issue;
- linked feature and requirement IDs;
- contract/test-design reference;
- implementation summary;
- test command and result;
- reviewer comment;
- integration result.

The author must not approve their own PR. Pair work should be recorded in the Issue or PR when both students contribute.

## Daily execution schedule

Adjust dates only if the instructor changes the deadline.

### 2 November: agree and prepare

- Confirm repository and stack.
- Read the master plan.
- Create `sprint-1`.
- Create Issues and six feature branches.
- Write SRS IDs, feature IDs, and acceptance criteria.
- Decide database entities and seed accounts.

**Gate:** both students agree on the data model and can explain the six features.

### 3 November: identity and account foundation

- Partner A implements F-01.
- Partner B implements F-02.
- Both write tests and review the contracts.
- Merge accepted F-01 and F-02 into `sprint-1`.

**Gate:** authenticated user can retrieve only their own seeded accounts.

### 4 November: opening balance and salary

- Partner B implements F-03.
- Partner A implements F-04.
- Add API/database integration tests.
- Merge only after teammate review.

**Gate:** opening balance and salary survive a fresh read and produce correct bank/income values.

### 5 November: split payment and repayment

- Partner B implements F-05.
- Both implement F-06.
- Add allocation mismatch and repayment tests.
- Run the first complete journey.

**Gate:** credit-card purchase, debt, repayment, bank balance, and summaries are correct.

### 6 November: integration and verification

- Run the full build and automated suite.
- Run persistence/restart verification.
- Run access-control verification.
- Run UI/end-to-end journey.
- Fix defects through `fix/...` branches.
- Capture commit IDs and test output.

**Gate:** no unexamined failure or skipped test remains.

### 7 November: documents and evidence

- Complete SRS.
- Complete feature inventory and traceability matrix.
- Complete System-Level SDS.
- Complete three-sprint plan.
- Complete all six feature contracts.
- Capture screenshots and test excerpts.
- Capture two Issue/PR histories.
- Complete contribution and AI-use declarations.
- Assemble the PDF in Parts A-F.

**Gate:** a TA can grade the PDF without opening separate specification files.

### 8 November: release and submission

- Run the final build and tests on the release candidate.
- Review all failed, skipped, incomplete, or changed items.
- Merge the accepted release into `main`.
- Create the immutable release tag/commit.
- Update the PDF with the final commit.
- Reopen and visually inspect the PDF.
- Submit before 23:59.

**Gate:** PDF, repository, release commit, screenshots, tests, and traceability all refer to the same assessed version.

## Deliverable 1 PDF checklist

### Part A: SRS — 10 points

- [ ] Stakeholder problem and selected context.
- [ ] User and Administrator actors.
- [ ] In-scope behavior.
- [ ] Explicit exclusions.
- [ ] Stable FR IDs.
- [ ] Stable BR IDs.
- [ ] Stable NFR IDs with measurable verification.
- [ ] Assumptions and decisions.
- [ ] Open questions and resolutions.

### Part B: feature inventory and traceability — 10 points

- [ ] All six Sprint 1 features.
- [ ] Later Sprint 2 and Sprint 3 features.
- [ ] Every FR mapped to a feature and sprint.
- [ ] Every BR mapped to a feature and verification.
- [ ] Important NFRs mapped to a responsibility/test.
- [ ] Coverage gaps and approved changes disclosed.

### Part C: System-Level SDS — 15 points

- [ ] UI/API/database architecture.
- [ ] Component responsibilities.
- [ ] Entity fields and relationships.
- [ ] Ownership links and constraints.
- [ ] Migration and seed procedure.
- [ ] Navigation and UI states.
- [ ] API conventions and error shape.
- [ ] Role/permission matrix.
- [ ] Session/token lifecycle.
- [ ] Environment variables and secret handling.
- [ ] Future Docker/GCP deployment plan.

### Part D: three-sprint plan — 5 points

- [ ] Sprint goal for each sprint.
- [ ] Feature IDs per sprint.
- [ ] Dependencies.
- [ ] Completion outcome.
- [ ] Explicit Sprint 1 scope.

### Part E: Sprint 1 contracts — 20 points

- [ ] F-01 contract.
- [ ] F-02 contract.
- [ ] F-03 contract.
- [ ] F-04 contract.
- [ ] F-05 contract.
- [ ] F-06 contract.
- [ ] UI/API/data specifications.
- [ ] Validation and boundary cases.
- [ ] Permissions.
- [ ] Acceptance criteria.
- [ ] STS with test IDs, inputs, actions, and expected results.
- [ ] Definition of Done.
- [ ] Visible contract/test-design history.

### Part F: working Sprint 1 and verification — 20 points

- [ ] Complete normal journey screenshots.
- [ ] Persisted retrieval evidence.
- [ ] Business-rule rejection evidence.
- [ ] Login/logout evidence.
- [ ] Forbidden role or ownership evidence.
- [ ] Backend/API authorization evidence.
- [ ] Build command and result.
- [ ] Test command and result.
- [ ] Passing/failing/skipped counts.
- [ ] AC-to-test result table.
- [ ] Domain-rule test excerpt.
- [ ] Access-restriction test excerpt.
- [ ] TDD red/green evidence.
- [ ] Two completed Issue/PR chains.
- [ ] Branch, reviewer, commit, and date evidence.
- [ ] Contribution table for both students.
- [ ] AI-use declaration.
- [ ] Known limitations and incomplete work.
- [ ] Repository URL and immutable release commit.

## Evidence capture template

Use this table for every selected demonstration:

| Field | Record |
|---|---|
| Feature/AC IDs | e.g. `F-05`, `AC-23` to `AC-26` |
| Role | `USER` or `ADMINISTRATOR` |
| Starting state | Seed data and preconditions |
| Steps | Short numbered actions |
| Expected result | Observable behavior |
| Actual result | What happened |
| Tested version | Commit/tag |
| Evidence | Screenshot, API response, test name |

## Final handoff report

Before handing work to the partner, report:

```text
Feature:
Issue:
Branch:
Changed files:
Requirements/AC covered:
Tests added:
Commands run:
Test result:
Known limitation:
Next action:
```

Never report a feature as complete when its tests have not run on the candidate commit.

