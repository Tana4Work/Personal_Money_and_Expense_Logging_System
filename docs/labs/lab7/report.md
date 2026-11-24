# Lab 7 Report — BR-12 No-Overdraft Repayment

- **Status:** Draft for team review
- **Repository:** `Tana4Work/Personal_Money_and_Expense_Logging_System`
- **Reporting window:** 2026-11-08 00:00 UTC through the post-deployment snapshot at 2026-11-24 12:04:07 UTC
- **Release:** `v1.1.0`, commit `8d0d4b18a1c564a05f857fe3d8e34505bcbb1a81`, Cloud Run revision `pmels-00011-rw4`

## Contents

- [Part C — Metrics](#part-c--metrics)
- [Part D — Readiness](#part-d--readiness)
- [Change summary](#change-summary)
- [TDD and release evidence](#tdd-and-release-evidence)
- [Version table](#version-table)
- [Contribution record](#contribution-record)
- [AI-use declaration](#ai-use-declaration)
- [Retrospective](#retrospective)
- [Known limitations](#known-limitations)
- [Remaining report work](#remaining-report-work)

## Change summary

### Change request

Before BR-12, `POST /api/transactions/repayment` accepted a positive repayment even when it made the user's bank balance negative. The approved change rejects a repayment that would take the source bank balance below zero and still accepts one that leaves exactly zero. The stated reason in the Issue is to prevent impossible balances and data-entry mistakes.

### Scope and preserved behavior

- The current all-time account balance is calculated with the same opening-balance-plus-inflows-minus-outflows formula used by `/api/summaries/balances`; transaction date does not make this an as-of calculation.
- Lab 7 applies the new rule to repayment only. It checks after authentication, amount/date validation, ownership, and account type checks.
- The balance check and transaction write run in one database transaction after locking the source Account row. The check returns HTTP 400 with `Insufficient bank balance for this repayment.` and writes no transaction/allocation when the new balance would be negative.
- Exactly zero remains valid. Card overpayment remains accepted. Cross-owner and Administrator financial access remain forbidden.
- No schema migration was needed. The opening-balance, receive-money, and split-payment behavior was not changed.

## TDD and release evidence

| Stage | Commit / PR | Recorded result |
|---|---|---|
| Pre-change integration tip | `8e54792` | Lab 7 CI setup at `lab7-staging`; the existing repayment route had no bank-balance guard. |
| Contract | PR [#67](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/pull/67), merge commit `971bb8a` | Approved by `Tana4Work`; CI run 45361310360 succeeded before implementation. |
| RED API run | Commit `9690c27`; [`issue-64-red-run.txt`](evidence/issue-64-red-run.txt) | 7 tests: 5 passed, 2 failed. TEST-28 got 201 instead of expected 400; TEST-30 got two 201 responses instead of one 201 and one 400. These failures exposed the missing rule on unchanged code. |
| RED client run | Commit `9690c27`; [`issue-64-red-client-run.txt`](evidence/issue-64-red-client-run.txt) | 10/10 passed; TEST-31 exercises the client message using a mocked 400 response. |
| GREEN API run | Commit `c025078`; [`issue-64-green-api-run.txt`](evidence/issue-64-green-api-run.txt) | 7/7 passed, including over-balance rejection, exact-zero acceptance, concurrency, preserved access checks, and card overpayment. |
| GREEN client run | Commit `c025078`; [`issue-64-green-client-run.txt`](evidence/issue-64-green-client-run.txt) | 10/10 passed, including TEST-31. |
| Reviewed implementation | PR [#68](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/pull/68), merged to `lab7-staging` | Approved by `Tana4Work`; CI runs 45365453696 and 45366231749 succeeded. |
| Release | PR [#69](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/pull/69), merged to `main` | Approved by `Tana4Work`; release test/deploy run 45373425293 succeeded. |
| Post-deployment | [`issue-65-post-deploy-checks.md`](evidence/issue-65-post-deploy-checks.md) | Five checks recorded PASS on `pmels-00011-rw4`; the additional timestamped concurrency probe had a wrong expected-value assertion, documented in that evidence file. |

The merge and run records are included in [`issue-66-github-snapshot.json`](evidence/issue-66-github-snapshot.json). The RED phase is attributed by plan to Tana, but the GitHub commit author is `thanaphon3417`; this discrepancy is listed in the contribution record for team confirmation.

## Version table

| Role | Tag / commit | Cloud Run revision |
|---|---|---|
| Accepted Sprint 1 baseline | `v1.0.1-uat` / `83371f7` | `pmels-00009-rwp` |
| Pre-change commit (`lab7-staging` before RED) | `8e54792` | — |
| Contract PR #67 merge | `971bb8a` | — |
| RED test commit | `9690c27` | — |
| GREEN implementation commit | `c025078` | — |
| Accepted Lab 7 release | `v1.1.0` / `8d0d4b18a1c564a05f857fe3d8e34505bcbb1a81` | `pmels-00011-rw4` |

## Part C — Metrics

The issue, pull-request, and Actions source snapshot is [`evidence/issue-66-github-snapshot.json`](evidence/issue-66-github-snapshot.json). The release and post-deployment evidence is [`evidence/issue-65-post-deploy-checks.md`](evidence/issue-65-post-deploy-checks.md). GitHub timestamps below are UTC.

### 1. Issues closed in the window

**21 issues** were closed from 8 November through the snapshot. The table includes all issues closed in that window, not only Lab 7 issues.

| Issue | Title | Closed (UTC) |
|---:|---|---|
| #19 | Start the GCP Free Trial | 2026-11-12 04:30:58 |
| #20 | Make the app cloud-ready and write the first deployment.md | 2026-11-12 16:28:27 |
| #21 | Containerize the app | 2026-11-13 04:29:05 |
| #22 | Add CI on Pull Requests | 2026-11-13 04:43:17 |
| #23 | Deploy to GCP for the first time | 2026-11-13 07:16:29 |
| #24 | Connect GitHub to GCP and set the merge gate | 2026-11-13 09:11:15 |
| #25 | Add the deploy workflow; release a visible change through staging into main | 2026-11-14 07:28:11 |
| #26 | Check persistence. Recommended: roll back and roll forward | 2026-11-14 08:36:29 |
| #27 | Finish deployment.md and the PDF | 2026-11-16 10:42:11 |
| #46 | Lab 6 UAT handoff for the partner team | 2026-11-20 06:58:46 |
| #47 | Lab 6 partner UAT-01 to UAT-06 | 2026-11-20 06:59:06 |
| #54 | Lab 6 UF-01 registration error | 2026-11-20 07:14:23 |
| #55 | Lab 6 UF-02 stale bank balance | 2026-11-20 07:39:03 |
| #51 | Lab 6 reply to partner review | 2026-11-20 07:39:34 |
| #59 | Lab 6 partner test of the controlled defect | 2026-11-21 04:43:16 |
| #52 | Lab 6 partner re-test and acceptance decision | 2026-11-21 06:08:23 |
| #50 | Lab 6 partner controlled defect exercise | 2026-11-21 08:53:26 |
| #53 | Lab 6 report (PDF) | 2026-11-21 09:26:57 |
| #63 | Lab 7 contract revision | 2026-11-24 09:13:18 |
| #64 | Lab 7 implementation | 2026-11-24 10:07:40 |
| #65 | Lab 7 release v1.1.0 | 2026-11-24 10:19:36 |

Issues #62 and #66 remained open at the snapshot; #56 remained open as a Sprint 2 enhancement.

### 2. Pull requests merged in the window

**23 PRs** were merged. The target column is the PR base branch.

| PR | Merged (UTC) | Target | Title |
|---:|---|---|---|
| #28 | 2026-11-12 09:26:54 | `sprint1-staging` | Prepare the app for the cloud (#2) |
| #29 | 2026-11-12 16:43:11 | `lab5-staging` | Add Lab 5 Docker deployment workflow |
| #30 | 2026-11-13 04:36:14 | `lab5-staging` | CI and Docker PR checks (#4) |
| #31 | 2026-11-13 04:43:28 | `main` | Release: CI and Docker files |
| #32 | 2026-11-13 05:52:53 | `lab5-staging` | Lab 5 deploy config |
| #33 | 2026-11-13 05:56:24 | `main` | Lab 5 staging |
| #35 | 2026-11-14 06:53:25 | `lab5-staging` | Part of #7: adapt deployment workflow to PMELS |
| #36 | 2026-11-14 06:59:22 | `main` | Lab 5 staging into main (7.4) |
| #37 | 2026-11-14 07:25:29 | `lab5-staging` | Add visible deployment proof marker |
| #38 | 2026-11-14 07:28:09 | `main` | Lab 5 staging into main (small visible change) |
| #39 | 2026-11-14 08:30:29 | `lab5-staging` | Keep signed-in users signed in after reload |
| #40 | 2026-11-14 08:36:28 | `main` | Release: Session persistence after reload |
| #42 | 2026-11-15 07:14:24 | `lab5-staging` | Add Lab 5 deployment documentation (#27) |
| #43 | 2026-11-15 07:17:07 | `main` | Lab 5 staging into main |
| #44 | 2026-11-15 08:54:58 | `lab5-staging` | Fix shell script line endings |
| #45 | 2026-11-15 08:57:21 | `main` | Lab 5 staging into main |
| #57 | 2026-11-20 07:36:34 | `lab6-staging` | Lab 6 fix for stale opening-balance display |
| #58 | 2026-11-20 07:39:01 | `main` | Release: Lab 6 fix for #55 |
| #60 | 2026-11-21 09:23:20 | `lab6-staging` | Add Lab 6 UAT records and move Lab 5 deployment doc |
| #61 | 2026-11-21 09:26:56 | `main` | Lab 6 document with partner |
| #67 | 2026-11-24 09:08:53 | `lab7-staging` | Revise F-06 contract for BR-12 |
| #68 | 2026-11-24 09:58:31 | `lab7-staging` | Implement BR-12 no-overdraft repayment |
| #69 | 2026-11-24 10:17:47 | `main` | Release Lab 7 BR-12 as v1.1.0 |

### 3. Release-candidate automated tests

GitHub Actions run [45373425293](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/actions/runs/45373425293) ran on release commit `8d0d4b18a1c564a05f857fe3d8e34505bcbb1a81`.

| Check | Result |
|---|---|
| Backend Vitest | 9 files, 38 tests passed; 0 failed |
| Frontend Vitest | 1 file, 10 tests passed; 0 failed |
| Backend build, frontend production build, and unified Docker build | Passed |
| Deployment migration and Cloud Run update | Passed; revision `pmels-00011-rw4` served 100% of traffic |
| Public smoke checks | `/api/health`, `/api/ready`, and `/` passed; optional login was skipped because smoke credentials were not configured |

**Smoke-test source note:** the deployment workflow's recorded summary mentions a categories check, but `deploy/smoke_test.py` and the run log show checks for health, readiness, and the app page only; the optional login was skipped. This report records only checks supported by the script and run log.

### 4. Lab 6 UAT findings on PMELS

| Finding | Issue | Classification and final status |
|---|---:|---|
| UF-01: registration/login returned 500 while Cloud SQL was stopped | #54 | Operations incident, classified not-defect; database was restarted; no code change or re-test. Closed. |
| UF-02: balance display stayed stale after saving opening balance | #55 | Accepted minor defect; RED test and GREEN client fix merged through PRs #57 and #58; partner re-test passed and Sprint 1 was accepted. Closed. |
| UF-03: category-account current balance displayed 0 | #56 | Enhancement for Sprint 2; the Lab 6 triage says this is expected Sprint 1 behavior. Still open. |

These records are from `docs/labs/lab6/README.md` and the related UAT triage/re-test records. The separate Lab 7 over-precision limitation is listed under readiness below.

**Source reconciliation:** the earlier shorthand in `lab7_plan.md` §8 has been corrected to match the detailed Lab 6 UAT records and GitHub Issues #54–#56: UF-01 was not-defect, UF-02 / #55 was an accepted minor defect that was fixed and re-tested, and UF-03 / #56 is a Sprint 2 enhancement.

### 5. CI and deployment workflow outcomes

There were **33 `CI & Docker Build` runs** in the window: **26 succeeded, 3 failed, and 4 were cancelled**. All four Lab 7 CI runs succeeded. Run IDs are grouped by branch below; the raw run records and URLs are in the GitHub snapshot export.

| Branch | Successful run IDs | Failed run IDs | Cancelled run IDs |
|---|---|---|---|
| `LAB5-10-fix/sh-line-endings` | 43696614006 | — | — |
| `LAB5-4-ci-pr-checks` | 43365000213 | 43364141211 | — |
| `LAB5-5-deploy-config` | 43374128164 | — | — |
| `LAB5-6-test/prove-gate-health` | 43397389972 | 43398621906 | — |
| `LAB5-7-auto-deploy` | 43568337420 | — | — |
| `LAB5-7-deploy-proof` | 43570902731 | — | — |
| `LAB5-8-persistence-and-rollback` | 43575966713 | 43575550433 | — |
| `LAB5-9-deployment-doc` | 43688915163, 43688882158 | — | — |
| `lab5-staging` | 43696778154, 43689134040, 43576450388, 43576352258, 43571112580, 43568835361, 43568672807, 43375050416, 43366896558 | — | 43696765877, 43689112565, 43571102048 |
| `LAB6-55-fix/opening-balance-refresh` | 44696033917 | — | — |
| `LAB6-docs/lab6-report` | 44888633239 | — | — |
| `lab6-staging` | 44889432474, 44696334509 | — | 44889413912 |
| `LAB7-63-docs/br12-contract` | 45361310360 | — | — |
| `LAB7-64-change/no-overdraft-repayment` | 45366231749, 45365453696 | — | — |
| `lab7-staging` | 45372462240 | — | — |

The `Deploy demo` workflow ran **8 times**, all successfully, on `main`: 43568938545, 43571233426, 43576628863, 43689261211, 43696888438, 44696527606, 44889632411, and 45373425293. The last run deployed v1.1.0.

**Interpretation (70 words):** Across the window, 21 issues closed and 23 PRs merged. The 33 CI runs include seven failures or cancellations, all on Lab 5 or Lab 6 branches; each of the four Lab 7 CI runs succeeded. All eight deployment runs succeeded. This historical non-green CI activity should not be confused with the v1.1.0 release result. **Action/owner:** Thanaphon will retain the branch/run-ID breakdown in the final report so the historical outcomes remain distinguishable from the release checks.

## Part D — Readiness

### Verdict: READY for the maintained Sprint 1 scope

This verdict applies the rule in `lab7_plan.md`: the release-candidate full suite has zero failures, all five post-deployment checks pass, and no open critical or major defect in Sprint 1 scope is recorded. Issue #56 is a Sprint 2 enhancement, not a Sprint 1 defect. The known amount-precision mismatch is minor and remains open.

| Readiness condition | Result and evidence |
|---|---|
| Full suite has zero failures | PASS — release run 45373425293: backend 38/38, client 10/10; builds passed. |
| Five post-deployment checks pass | PASS — see `evidence/issue-65-post-deploy-checks.md`; all on `pmels-00011-rw4`. |
| No open critical/major Sprint 1 defect | PASS based on the documented triage: #54 not-defect, #55 fixed/re-tested, #56 Sprint 2 enhancement. |
| Deployment and readiness | PASS — run 45373425293 succeeded; readiness returned `{"status":"ready","db":"connected"}`. |
| Configuration and secrets | `server/.env.example` contains local placeholders; `client/.env.example` documents an optional API URL. `.env` and `.env.*` are Git-ignored. The temporary admin test credential is in an ignored local file and is not included in the report or export. |
| Run instructions | README documents Docker PostgreSQL setup, migrations, seeding, server/client startup, and test commands. |

### Known defects and debt

| Item | Status | Impact / planned action |
|---|---|---|
| Amount parser accepts up to 30 decimal places although F-05/F-06 contracts require rejection of over-precision | Minor, open; deferred to Sprint 2 per Lab 7 plan | Contract and implementation can disagree at this boundary; plan a validation decision/fix in Sprint 2. |
| BR-12 is enforced only for repayment in Lab 7 | Technical debt | Other Cash outflows could bypass the rule; Sprint 2 cash-payment and transfer contracts must reference and reuse the balance helper. |
| Lowering an opening balance below prior spending can produce a negative balance | Technical debt / out of scope | Decide how F-03 opening-balance edits interact with BR-12 in Sprint 3. |
| Amount/date validation is duplicated between positive-amount parsing and opening-balance validation | Technical debt | Consolidation is listed for Sprint 2/3 in the Lab 7 plan. |
| Issue #56: category-account current balance shows 0 | Open enhancement, not a Sprint 1 defect | Category totals or hiding the column are planned for Sprint 2. |

## Contribution record

The issue plan records intended ownership; GitHub records show PR authors, commits, and reviews. The table keeps those two kinds of evidence separate.

| Member | Planned responsibility | Recorded Lab 7 activity |
|---|---|---|
| Tana Udompornkul (`Tana4Work`) | Own the change-request Issue; planned RED-test author; review the contract, implementation, and release PRs; write the readiness section | Approved PRs #67 (contract), #68 (implementation), and #69 (release). The plan assigned RED tests to Tana; no RED test commit is attributed to her GitHub account. |
| Thanaphon Ratchatakulpong (`thanaphon3417`) | GREEN implementation; write Part C metrics; review the readiness section | GitHub records `thanaphon3417` as author of PRs #67 and #68 and their commits, including RED commit `9690c27`, GREEN commit `c025078`, and evidence commits. Codex assisted with creating the RED/GREEN tests and implementation in this session; the v1.1.0 tag was also created under this account. |

**Team confirmation:** Tana and Thanaphon confirmed the contribution record as written. The plan/commit attribution difference is disclosed above rather than treating the account author as proof of unaided work.

## AI-use declaration

OpenAI Codex assisted in this Lab 7 work by analyzing the provided project documents and source, drafting and editing the BR-12 implementation and tests, running verification, collecting GitHub evidence, preparing release documentation, and drafting this report. The commits use the configured human Git identity; that identity does not mean the work was unaided. Tana reviewed and approved PRs #67–#69. Tana and Thanaphon confirmed this AI-use declaration.

## Retrospective

The plan requests short answers about what helped, what hurt, and what the team will change. Tana and Thanaphon confirmed the retrospective answers below.

**Confirmed by Tana and Thanaphon.**

| Prompt | Tana | Thanaphon |
|---|---|---|
| What helped this Lab 7 work? | Keeping the contract, implementation, review, and release in separate reviewed steps made the change easier to trace. The recorded CI and post-deployment checks gave us evidence at each stage. | The RED/GREEN test sequence and the linked release evidence helped connect the requirement change to its implementation and deployment. The version table made the release and Cloud Run revision easy to identify. |
| What made the work harder? | The planned RED-test ownership did not match the GitHub commit attribution, so the contribution record needed to distinguish the plan from the recorded history. | The timestamped concurrency probe had an incorrect expected-value assertion, which had to be documented as a limitation in the evidence. |
| What will you change next time? Include one action and owner. | Before implementation starts, Tana will verify that the planned author and reviewer responsibilities are clear and recorded consistently. | Before recording a concurrency result, Thanaphon will independently check the probe's expected values against the scenario and evidence. |

## Known limitations

- The five post-deployment checks passed on `pmels-00011-rw4`; only repayment is covered by BR-12 in this release.
- The amount-precision mismatch, opening-balance limitation, and wider Cash-outflow coverage remain as listed above.
- Six synthetic verification users were created in the deployed database during release checks. The project API has no user-deletion operation; these accounts remain present.
- The timestamped manual concurrency script recorded the expected one-success/one-rejection behavior and a non-negative bank balance of 150, but exited with status 1 because its assertion expected 400. The automated TEST-30 and the release CI passed; the manual harness arithmetic note is preserved in the Issue #65 evidence.
