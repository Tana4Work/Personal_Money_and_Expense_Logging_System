# Deliverable 2 Plan: Sprint 2 Completion and Sprint 3 Progress

**Group:** EN-008 JOmmy (Section 31), Theme 7: Personal Money and Expense Logging System (PMELS)
**Members:** Tana Udompornkul (67070503418, `Tana4Work`), Thanaphon Ratchatakulpong (67070503417, `thanaphon3417`)
**Repo:** https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System
**Due:** 29 November 2026, 23:59 on LEB2, as one self-contained PDF. 70 points (7% of the course grade).
**Final delivery:** 13 December 2026. The examination period of 1–11 December leaves little build time, so the product must be substantially complete by 29 November.

---

## 1. Required outcome (from `project_deliverable_2_v1.pdf`)

- Every Sprint 2 feature is complete, reviewed, integrated and verified against its contract. No feature moves to Sprint 3 without an approved scope revision.
- Contracts exist for every Sprint 3 feature. At least one meaningful Sprint 3 workflow is implemented and tested.
- The candidate on `main` integrates Sprint 1, Sprint 2 and the implemented Sprint 3 work, and is deployed to GCP through the Lab 5 pipeline.
- Sprint 1 behavior, authentication, backend permissions and record ownership still work.
- A remaining-work list gives the exact features and AC, defects, owners, dependencies, next actions and dates up to 13 December.

| Part | Points | What must be shown |
|---|---|---|
| A. Sprint 1 continuity and change status | 5 | The Sprint 1 journey still works on the candidate. A change/defect register covering Labs 5–7. BR-12 recorded as an approved baseline revision. |
| B. Sprint 2 contracts and working increment | 25 | Contracts before code. A working F-08 to F-14 with real persistence. A completion table, TDD evidence, reviewed Issues/PRs, and the `v2.0.0` release. |
| C. Sprint 3 contracts and working progress | 15 | Contracts for F-15 to F-18. F-15 implemented and tested. The status of each feature and the remaining-work table. |
| D. Requirements and test traceability | 10 | Full current SRS, feature inventory and System-Level SDS. One matrix covering every FR, BR and important NFR. |
| E. Integrated release candidate | 15 | `v2.1.0-rc` on `main`, deployed. Build, test, CI and regression output tied to the commit. Post-deploy checks, setup summary and completion plan. |

## 2. Starting point

| Item | Value |
|---|---|
| Accepted Sprint 1 baseline | tag `v1.0.1-uat`, commit `83371f7`, revision `pmels-00009-rwp` (CPMS acceptance, 21 Nov 2026) |
| Lab 7 release (BR-12) | tag `v1.1.0`, commit `8d0d4b1`, revision `pmels-00011-rw4` |
| Current `main` | `eebb583`, revision `pmels-00012-458` (docs-only change from `v1.1.0`) |
| Implemented features | F-01 to F-06 (Sprint 1), F-07 registration, BR-12 (repayment only) |
| Next free IDs | Feature **F-08**, **AC-41**, **TEST-33** |
| Carried-over debt | BR-12 covers repayment only (High). Editing the opening balance can make a balance negative. Amount and date validation are duplicated. The smoke test makes no authenticated check. Minor defect: the amount parser accepts 30 decimal places. |

## 3. Scope

### Sprint 2: all features must be complete by `v2.0.0`

| ID | Feature | Behavior summary | Owner |
|---|---|---|---|
| F-08 | Account management | Create, rename and archive accounts of all five types (`CASH`, `LOAN_GIVEN`, `LOAN_TAKEN`, `INCOME`, `EXPENSE`), including wallet and bank subtypes. Only the owner can manage them. | Thanaphon |
| F-09 | Opening-balance management | Record or edit the opening balance of a bank or wallet account. Correct a wrong value without making Cash negative. | Thanaphon |
| F-10 | Loan Given | Lend money: a payment allocated to `LOAN_GIVEN`. Receive a repayment of a loan given. The outstanding amount is tracked. | Thanaphon |
| F-11 | Loan Taken and borrowing | Borrow money: a receipt allocated to `BORROWING`. Repay any loan-taken account, not only the card. Debt is tracked. | Thanaphon |
| F-12 | Transfers | Move money between the user's own Cash accounts, with BR-12 applied to the source. | Tana |
| F-13 | Transaction corrections | Edit or delete a transaction. Allocations, ownership and BR-12 are re-validated. | Tana |
| F-14 | Transaction search and filtering | Server-side filters, restricted to the owner, with pagination. | Tana |
| — | New UI for Sprint 2 | Restructure the single-page client (`client/src/App.tsx`) into navigable screens for F-08 to F-14, following the PMELS Charcoal spec in `UI-specs.md` v2.0. | Tana |
| BR-12 | Shared no-overdraft check | Move the repayment-only check into one shared helper used by every outflow from a Cash account. | Tana |

"Loan repayments beyond the card repayment" (from `PROJECT_PLAN.md`) is covered by F-10 and F-11 and is traced to both.

### Sprint 3: plan only for now; Issues and branches are opened after `v2.0.0`

| ID | Feature | D2 target | Owner |
|---|---|---|---|
| F-15 | Category spending summaries (closes Lab 6 UF-03) | Implemented and tested | Tana |
| F-16 | Favorite transactions and the favorites list | Contract only | Tana |
| F-17 | Duplicate a transaction as an editable draft | Contract only | Tana |
| F-18 | Income and expense reports | Contract only | Tana |
| — | Hardening: regression fixes and validation clean-up (30-decimal defect, duplicated validation) | Planned | Both |

## 4. Design decisions

| # | Decision | Status |
|---|---|---|
| D-1 | All nine Sprint 2 items stay in Sprint 2, so no scope revision is requested. | Agreed 25 Nov |
| D-2 | The Sprint 3 progress feature for D2 is F-15 Category spending summaries. | Agreed 25 Nov |
| D-3 | BR-12 becomes one shared check inside the same DB transaction, with a `SELECT ... FOR UPDATE` lock on the source Account row. It is used by payments from bank or wallet, transfers, loans given, repayments and corrections. Card overpayment stays allowed. | Agreed 25 Nov |
| D-4 | Release flow: `sprint2-staging` → `v2.0.0` (the Sprint 2 release), then `sprint3-staging` → `v2.1.0-rc` (the D2 candidate). | Agreed 25 Nov |
| D-5 | Each feature branch delivers its API and its API/DB tests. Issue 06 delivers the new UI for all Sprint 2 features plus client tests. The client is one file, so one UI branch avoids merge conflicts. | Agreed 25 Nov |
| D-12 | UI versions. **Until Issue 06 merges, follow the old UI, v1.0 Zen Green ([`UI-specs-v1.0.md`](../UI-specs-v1.0.md)).** Any UI change in Issues 01 to 05 uses v1.0 styling and components. Issue 06 then moves the whole client to v2.0 PMELS Charcoal ([`UI-specs.md`](../UI-specs.md)) in one reviewed change. | Agreed 25 Nov |
| D-6 | Corrections (F-13) edit in place and allow delete, with `updatedAt` recorded. Balances are computed from transactions, so no stored balance needs repair. A change is rejected if any Cash account would go below 0.00. | Adopted in contracts v1.0 (#73); the reviewer confirms it in the contracts PR |
| D-7 | An account with transactions can only be archived (hidden from forms, still counted in history and balances). Hard delete is allowed only when the account has no transactions. | Adopted in contracts v1.0 (#73) |
| D-8 | A Cash opening balance must be ≥ 0.00. An edit that would push the current balance below 0.00 is rejected under BR-12. For card and loan accounts, the opening balance stays the starting debt. | Adopted in contracts v1.0 (#73) |
| D-9 | Search filters on date range, account, transaction type, amount range and note text. It runs on the server for the owner only, newest first, with pagination. Another user's account ID returns an empty result rather than revealing that the account exists. | Adopted in contracts v1.0 (#73) |
| D-10 | Balance calculation counts allocation lines on Cash and loan accounts (transfers, loans given, repayments, borrowing). On payment-form transactions `receivingAccountId` is ignored. Without this, a transfer or loan would never change the target account's balance. Sprint 1 data keeps identical balances. See [Sprint 2 contracts](sprints/sprint-2/README.md) §3. | Adopted in contracts v1.0 (#73) |
| D-11 | Amounts allow at most 2 decimal places, which fixes the Lab 7 minor defect. Transactions get an optional `note` of up to 200 characters, needed for F-14 search. | Adopted in contracts v1.0 (#73) |

## 5. Branch and release flow

```text
main (eebb583)
 └─ sprint2-staging                       setup commits for Issue 00 (this plan + CI) go directly here
     ├─ SP2-00-docs/sprint2-contracts     contracts F-08–F-14 + BR-12 shared; merge BEFORE any code
     ├─ SP2-01-br12-shared-check-transfers
     ├─ SP2-02-F08-F09-accounts-opening-balance
     ├─ SP2-03-F10-F11-loans
     ├─ SP2-04-F13-transaction-corrections
     ├─ SP2-05-F14-transaction-search
     ├─ SP2-06-ui/sprint2-screens
     └─ release PR → main → tag v2.0.0 → auto-deploy (Sprint 2 release)
main (v2.0.0)
 └─ sprint3-staging                       (planned)
     ├─ SP3-08-F15-contracts-category-summaries
     └─ release PR → main → tag v2.1.0-rc → auto-deploy (D2 candidate)
```

The same rules as Sprint 1 and Lab 7 apply:

- Every branch starts from the current staging tip and is merged by a PR into staging.
- The teammate reviews every PR with a specific check, question or finding. Authors never approve their own PRs.
- Commit order on each feature branch: `test(#n): ... (RED)` → `docs(#n): save RED test evidence` → `feat(#n): ... (GREEN)` → `docs(#n): save GREEN test evidence`.
- CI must be green before a merge. No test is weakened or skipped to make it pass.
- Record the commit, CI run and Cloud Run revision for every release.
- Every merge to `main` deploys automatically, so `main` only receives release PRs.

## 6. Issues and branches

| No. | Issue title | Labels | Branch (from) | PR into | Author → Reviewer | Depends on | Target |
|---|---|---|---|---|---|---|---|
| 00 | SP2 Setup: Deliverable 2 plan, CI on `sprint2-staging`, Sprint 2 contracts (F-08–F-14) | `sprint-2`, `docs`, `contract` | Setup commits directly on `sprint2-staging`, then `SP2-00-docs/sprint2-contracts` | `sprint2-staging` | Plan/CI: Tana. Contracts: each owner writes their own and the other reviews | — | 25–26 Nov |
| 01 | SP2: BR-12 shared outflow check + F-12 Transfers | `sprint-2`, `feature`, `rule` | `SP2-01-br12-shared-check-transfers` | `sprint2-staging` | Tana → Thanaphon | 00 | 26 Nov |
| 02 | SP2: F-08 Account management + F-09 Opening-balance management | `sprint-2`, `feature` | `SP2-02-F08-F09-accounts-opening-balance` | `sprint2-staging` | Thanaphon → Tana | 00 | 26 Nov |
| 03 | SP2: F-10 Loan Given + F-11 Loan Taken and borrowing | `sprint-2`, `feature` | `SP2-03-F10-F11-loans` | `sprint2-staging` | Thanaphon → Tana | 01, 02 | 27 Nov |
| 04 | SP2: F-13 Transaction corrections | `sprint-2`, `feature`, `rule` | `SP2-04-F13-transaction-corrections` | `sprint2-staging` | Tana → Thanaphon | 01, 03 | 28 Nov (AM) |
| 05 | SP2: F-14 Transaction search and filtering | `sprint-2`, `feature` | `SP2-05-F14-transaction-search` | `sprint2-staging` | Tana → Thanaphon | 02 | 27 Nov |
| 06 | SP2: New UI for Sprint 2 features | `sprint-2`, `ui` | `SP2-06-ui/sprint2-screens` | `sprint2-staging` | Tana → Thanaphon | 01–05 APIs; the screen shell can start from the contracts | 27–28 Nov |
| 07 | SP2: Sprint 2 release v2.0.0 and post-deployment checks | `sprint-2`, `release` | none: release PR `sprint2-staging` → `main` | `main` | Thanaphon → Tana | 01–06 | 28 Nov (midday) |

Planned, but not opened yet:

| No. | Issue title | Branch (from) | Author → Reviewer | Target |
|---|---|---|---|---|
| 08 | SP3: Sprint 3 contracts (F-15–F-18) + F-15 Category spending summaries | `SP3-08-F15-contracts-category-summaries` (from `sprint3-staging`) | Tana → Thanaphon | 28 Nov |
| 09 | SP3: Release candidate v2.1.0-rc and post-deployment checks | release PR `sprint3-staging` → `main` | Thanaphon → Tana | 28 Nov (night) |
| 10 | D2: Report (Parts A–E, change register, SRS/features/SDS/traceability, PDF) | `D2-10-docs/report` (from `main` after 09) | Both, cross-reviewed | 29 Nov |

### Issue 00: SP2 Setup (Deliverable 2 plan, CI, Sprint 2 contracts)

**Setup commits made directly on `sprint2-staging`** (the Lab 6 and Lab 7 pattern):
1. `docs(d2): add Deliverable 2 plan and issue list (#<Issue 00 number>)`: adds this file.
2. `ci: run PR checks on sprint2-staging (#<Issue 00 number>)`: adds `sprint2-staging` to `pull_request.branches` in `.github/workflows/ci-docker.yml`. **Required:** without it, PRs into `sprint2-staging` get no CI run and Part B loses its CI evidence.

**Contracts on `SP2-00-docs/sprint2-contracts`:** one file per feature in `docs/sprints/sprint-2/`, using the same structure as `docs/sprints/sprint-1/F-0x-*.md`:
- `F-08-account-management.md`, `F-09-opening-balance-management.md`, `F-10-loan-given.md`, `F-11-loan-taken-borrowing.md`, `F-12-transfers.md`, `F-13-transaction-corrections.md`, `F-14-transaction-search.md`.
- Each file contains:
  - Linked FR/BR/NFR, using the IDs from the Deliverable 1 SRS.
  - The feature-level SDS and workflow.
  - UI, API and data definitions. Where a layer needs no change, say so.
  - Validation, errors, boundary cases and permissions (401 for unauthenticated, 403 for other users and for Administrators).
  - Numbered AC starting at **AC-41**, and test-spec entries starting at **TEST-33**, each with level, input, preconditions and expected result.
  - The Definition of Done and a version history (v1.0).
- Shared BR-12 note: update the SRS BR-12 scope from "repayment only" to every Cash outflow, with a change-log entry. Add an SDS note on the shared helper and row lock.
- `GLOSSARY.md`: add Transfer, Loan Given, Borrowing, Archive and Correction.
- D-6 to D-9 must be confirmed before this PR merges.
- **Done when:** the teammate reviews every contract with a specific comment, the PR merges into `sprint2-staging`, and the merge commit is recorded as the "contracts before implementation" point.

### Issue 01: BR-12 shared outflow check + F-12 Transfers

1. RED: TEST IDs for these:
   - Transfer above the source balance → 400, nothing stored.
   - Transfer leaving exactly 0.00 → 201.
   - Transfer to the same account → 400.
   - Transfer to another user's account → 403.
   - Concurrent transfers never overdraw the source.
   - The existing TEST-28 to TEST-32 still pass, as regression guards.
2. GREEN:
   - Extract `assertCashBalancesNotNegative()` (see F-12 contract), called inside `prisma.$transaction` after the auth, ownership and type checks.
   - Route repayment through it.
   - Add the `TRANSFER` allocation on payment and receipt of a transfer.
3. Run the full `npm test` and record pass, fail and skip counts.
- **Done when:** CI is green, the PR has a specific review comment from Thanaphon, and the branch is merged.

### Issue 02: F-08 Account management + F-09 Opening-balance management

- API to create, rename, archive and delete (D-7) accounts of the five types and their subtypes. Archived accounts are excluded from form choices but kept in history and balances.
- Opening balance: allow wallets as well as banks, allow editing, and apply the D-8 floor. This closes the carried-over debt item "opening-balance edit can go negative".
- Tests:
  - Duplicate name for the same user (rule as written in the contract).
  - Invalid type or subtype combination.
  - Archive or delete of an account with transactions.
  - Another user's account → 403.
  - Administrator → 403.
  - Persisted after re-fetch.
- **Done when:** CI is green, the PR has a review comment from Tana, and the branch is merged.

### Issue 03: F-10 Loan Given + F-11 Loan Taken and borrowing

- F-10:
  - A payment from Cash allocated to `LOAN_GIVEN` (BR-12 applies).
  - Receiving money allocated as a `REPAYMENT` of a loan given.
  - The outstanding amount appears in summaries.
- F-11:
  - A receipt allocated to `BORROWING` from a loan-taken account.
  - Repayment from Cash to any `LOAN_TAKEN` account (generalizing the card repayment).
  - A charge made on a loan-taken account.
- Tests:
  - Allocation totals.
  - The wrong account type for each allocation → 400.
  - The ownership of every referenced account.
  - Outstanding and debt calculations.
  - Cross-feature: a loan repayment affects bank balance, debt and history consistently.
- **Done when:** CI is green, the PR has a review comment from Tana, and the branch is merged.

### Issue 04: F-13 Transaction corrections

- `PATCH` and `DELETE` on the user's own transactions, per D-6, in one DB transaction.
- The new values are re-validated: allocation total, account types, ownership and BR-12 on every affected Cash account.
- Tests:
  - An edit that would overdraw → 400 and the original is unchanged.
  - A delete of an inflow that would leave Cash negative → 400.
  - Another user's transaction → 403.
  - The edited values persist.
  - Summaries are recalculated.
- **Done when:** CI is green, the PR has a review comment from Thanaphon, and the branch is merged.

### Issue 05: F-14 Transaction search and filtering

- New `GET /api/transactions/search` with query filters per D-9, validated (invalid date range → 400), paginated. The Sprint 1 `GET /api/transactions` stays unchanged.
- Tests:
  - Each filter.
  - Combined filters.
  - Empty result.
  - User A never sees User B's records, even with User B's account ID.
  - Page boundaries.
- **Done when:** CI is green, the PR has a review comment from Thanaphon, and the branch is merged.

### Issue 06: New UI for Sprint 2 features

- Restructure `client/src/App.tsx` into navigable screens:
  - Overview
  - Accounts (create, rename, archive, opening balance)
  - Record (payment or charge with split allocation, receive money, transfer, repayment)
  - Loans (given and taken, with outstanding amounts)
  - History (search, filters, edit and delete)
- Build the Sprint 2 screens, then switch the whole client from v1.0 Zen Green (`UI-specs-v1.0.md`, used until this point) to the **PMELS Charcoal** design system in `UI-specs.md` v2.0 (tokens, components, screens, accessibility). Keep the Administrator view. Every screen shows validation, loading, empty and server-error states. Server rejections are shown on screen as AC-40 does for repayment, with no client-side balance pre-check.
- Client tests in `client/tests/` for each new form's validation and server-error display. Run the Sprint 1 UI tests again unchanged as regression checks.
- When it merges, update the "Implementation status" table in `UI-specs.md` (the spec itself was written in Issue 00).
- **Done when:** CI is green, the PR has a review comment from Thanaphon, the full Sprint 1 journey and every Sprint 2 journey work through the UI on local Docker, and the branch is merged.

### Issue 07: Sprint 2 release v2.0.0

- A reviewed release PR `sprint2-staging` → `main`. Tag **`v2.0.0`**. Record the commit, deploy run ID and Cloud Run revision.
- Post-deployment checks against Cloud Run, using a fresh synthetic user:
  1. The Sprint 1 journey (opening balance → salary → split card purchase → repayment) persists.
  2. A transfer above the balance → 400, balances unchanged.
  3. Lend money, then receive the repayment: the outstanding amount returns to 0.
  4. Correct a transaction, re-fetch it, and check the summary updates.
  5. Search returns only the user's own records.
  6. Another user's account or transaction → 403. Administrator on financial endpoints → 403. Unauthenticated → 401.
- **Done when:** every check is recorded with its time and revision, and the Sprint 2 completion table (Part B) is filled in.

## 7. Schedule

| Date | Work | Exit check |
|---|---|---|
| Wed 25 Nov | Open Issue 00. Create `sprint2-staging`. Make the setup commits. Confirm D-6 to D-9. Write the contracts. Finish the remaining Lab 7 items. | `sprint2-staging` and CI are pushed |
| Thu 26 Nov | Merge the contracts PR. Issues 01 and 02 RED → GREEN. Start the UI shell (06). | 01 and 02 merged |
| Fri 27 Nov | Issues 03 and 05. Start 04. Add the screens for 01–03 and 05 in 06. | 03 and 05 merged |
| Sat 28 Nov | Merge 04 and 06 in the morning. **Release `v2.0.0`** (07) at midday. Then `sprint3-staging`, Issue 08 (F-15) and Issue 09 (`v2.1.0-rc` deploy). Capture all evidence at night. | `v2.1.0-rc` deployed |
| Sun 29 Nov | Issue 10: report and PDF. Submit Lab 7 and D2 by 23:59. | Both PDFs submitted |

If something slips, the order to protect is: Sprint 2 features (B, 25 pts) → deployed candidate (E, 15) → F-15 (C, 15) → report polish. F-16 to F-18 are contracts only for D2.

### Completion plan to 13 December (Part C and Part E)

Exams run from 1 to 11 December. Before the D2 PDF goes in, check these dates against both students' exam timetables.

| Date | Work | Owner | Exit check |
|---|---|---|---|
| Mon 30 Nov | F-16 Favorites and F-17 Duplicate as draft (contracts already merged in Issue 08, built test-first) | Tana (Thanaphon reviews) | Both merged into `sprint3-staging` |
| 1–3 Dec | F-18 Income and expense reports (Tana). Hardening: shared validation and any D2 defects (Both) | Tana / Both | Merged, CI green |
| 4–6 Dec | Release `v3.0.0-rc` and deploy. Ask CPMS to re-test the Lab 6 UAT cases and the affected journeys | Both + CPMS | UAT re-test records with tester and version |
| 7–10 Dec | Fix accepted UAT findings, then run the full regression suite on the final commit. Tag `v3.0.0` | Both | All tests pass on the final commit, deployed |
| 11–12 Dec | Final traceability (every requirement marked PASS, FAIL, SKIPPED or INCOMPLETE), NFR checks, Definition of Done review, video (max 4 min, both students), final PDF | Both | PDF and YouTube link ready |
| Sun 13 Dec | Submit by 23:59 | Both | Submitted |

## 8. Evidence to capture for the PDF

| Part | Evidence |
|---|---|
| Front matter | Names and IDs, theme, repo URL, immutable tag and commit, deployed URL and revision, navigation table (part → pages → IDs) |
| A | `v1.0.1-uat`/`83371f7` continuity run on the candidate. Change/defect register: ID, source (Lab 5/6/7), requirement or feature affected, decision, status, fix release, re-test result (D-01/UF-02, UF-03, BR-12, debt items, 30-decimal defect). Approved baseline revisions with their rationale. |
| B | All Sprint 2 contracts in full. Completion table: feature → AC → implementation → test → result → release `v2.0.0`. TDD RED/GREEN commits and output. Two Issue/PR chains (01 and 03): branch, author, reviewer, review comment, staging merge, release. |
| C | All Sprint 3 contracts. F-15 implemented with tests. Status table (planned, in progress, implemented, tested, accepted). Remaining-work table with owners and dates up to 13 Dec. |
| D | Full SRS, feature inventory and System-Level SDS (replacing the Lab 7 amendment-only `docs/srs.md`, `docs/traceability.md` and `docs/system-sds.md`). Matrix: requirement → feature → sprint → AC or NFR → planned test → actual file/test → result and version. Coverage gaps listed explicitly. |
| E | `npm run build` and `npm test` on the candidate commit (pass, fail and skip counts). CI run ID. Deploy run ID and revision matching the tag. Post-deploy journey and persistence check. Setup summary (dependencies, environment-variable names, Docker, migrate and seed, test and deploy). Readiness review and plan to 13 Dec. |
| Program demos | Two Sprint 2 features (F-12 transfer rejection, F-10/F-11 loan journey), F-15, and the Sprint 1 journey. Each with feature and AC IDs, role, starting state, steps, expected and actual result, and version. Must include persisted retrieval, a rule rejection, and an API-level forbidden or ownership call. |
| Test excerpts | One domain or cross-feature rule (BR-12 transfer or loan), one access restriction (cross-user transaction edit). Each with setup, assertion and run output. |

No real passwords, tokens or secrets go into the PDF or Git. Test accounts come from the seed procedure.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Nine Sprint 2 items in four days, with Lab 7 due the same day | Contracts merged by 26 Nov. Pair on blocking work. Cut scope only inside Sprint 3, never in Sprint 2. |
| The single-file client causes merge conflicts | All UI work goes in Issue 06 (D-5). Feature branches stay on the API and tests. |
| Every merge to `main` redeploys | Only release PRs (07 and 09) go to `main`. Lab 7 report merges must not land in the middle of a Sprint 2 change. |
| BR-12 refactor breaks the Lab 7 behavior | TEST-28 to TEST-32 run unchanged as regression guards in Issue 01. |
| Uneven load after the owner change (25 Nov): Tana owns Issues 01, 04, 05, 06 and F-15 to F-18; Thanaphon owns 02 and 03 | Thanaphon takes the Issue 07 and 09 releases, the evidence capture, and pairs on Issue 06 screens once 02 and 03 merge. Rebalance at the 27 Nov check-in if 01 or 06 slips. |
| Coverage claims don't match the tests | Each matrix row points to the real test file and name. A test that hasn't run is marked "planned", never "done". |

## 10. Change log

| Date | Change |
|---|---|
| 2026-11-25 | First version: scope, decisions D-1 to D-9, Issues 00–07, planned 08–10, schedule and evidence map. |
| 2026-11-25 | The v1.0 UI spec is kept as `UI-specs-v1.0.md` and stays in force until Issue 06 (D-12). `UI-specs.md` v2.0 takes effect when Issue 06 merges. |
| 2026-11-25 | Owners changed: F-08 to F-11 → Thanaphon; F-12 to F-14, the BR-12 helper, the new UI and F-15 to F-18 → Tana. Reviewers swapped to match. `UI-specs.md` rewritten as the PMELS Charcoal design system (v2.0). |
| 2026-11-25 | Sprint 2 contracts v1.0 written (Issue 00). D-6 to D-9 adopted. D-10 (balance calculation) and D-11 (2-decimal amounts, note) added. Completion plan to 13 Dec added. |
