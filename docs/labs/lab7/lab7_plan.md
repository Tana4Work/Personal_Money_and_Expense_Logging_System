# Lab 7 Plan: No-Overdraft Repayment Rule

**Group:** EN-008 JOmmy (PMELS, Theme 7)
**Members:** Tana Udompornkul (67070503418), Thanaphon Ratchatakulpong (67070503417)
**Issues and branches:** see `issues.md` in this folder
**Due:** 29 Nov 2026, 23:59 (same day as Deliverable 2; separate PDF)
**Repo:** https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System
**Deployed:** https://pmels-203670311966.asia-southeast1.run.app (Cloud Run service `pmels`)

> Working plan agreed on 23 Nov 2026. This file is planning only. It is **not** the Part A
> contract evidence: the contract changes are committed later on the Lab 7 branch (step 3).

---

## 1. The change in one line

**Old (Sprint 1, F-06):** a repayment from a bank account to a credit card is accepted for any valid positive
amount, even if the bank balance becomes negative.
**New:** a repayment is **rejected** if it would make the source bank account's balance **below 0.00**.
Leaving exactly 0.00 is allowed.

- Where the old behavior lives: `POST /api/transactions/repayment` in `server/src/app.ts` (~line 317).
  It checks amount/date/ownership/types, then creates the transaction with no balance check.
- Reason for the change request: users can record repayments larger than the money in their bank,
  which hides data-entry mistakes and shows impossible balances. This is a product-owner decision, not
  UAT feedback, and the Issue must say so honestly.

## 2. Decisions (all agreed)

| # | Decision |
|---|---|
| D1 | Rule: reject if `balance_after < 0.00`; accept if `balance_after = 0.00`. Boundary: balance 500.00 → repay 500.00 accepted, 500.01 rejected. |
| D2 | "Balance" = **current all-time balance**, computed like `GET /api/summaries/balances` (opening + incoming − outgoing over all transactions, ignoring `transactionDate`). Not an as-of-date balance. |
| D3 | BR-12 is written generally ("an outflow from a Cash account must not make its balance negative"), but Lab 7 implements and verifies it **only for repayment**. Sprint 2 payment-from-cash/transfer contracts must reference BR-12 and reuse the same helper. |
| D4 | Lowering the opening balance (F-03) below what was already spent is **out of scope**. Record it as a known limitation and debt item. |
| D5 | Paying more than the card debt (card balance flips to credit) stays **unchanged**. Covered by preserved-behavior test TEST-32. |
| D6 | Concurrency: the balance check and the insert run in **one DB transaction that locks the source account row first** (`SELECT ... FOR UPDATE` inside `prisma.$transaction`). Two competing repayments must not both succeed. |
| D7 | Rejection = **HTTP 400** `{ "error": "Insufficient bank balance for this repayment." }`. No transaction or allocation rows are written, and the response shows no balance figure. |
| D8 | UI: show the server error on the repayment form, plus one client test. No client-side pre-check (the backend is the enforcement point). |
| D9 | Balance check runs **last**, after auth → amount → date → ownership → account types. A cross-owner request must still get 403, never a balance message, so other users' balances can't be probed. Every existing F-06 expected result stays the same. |
| D10 | No migration needed. Seed profiles never overdraw (checked `server/prisma/seed.ts`). The seed inserts via Prisma directly, so it bypasses the API rule. That is fine, but write it in the impact table. |

## 3. IDs to add (continuing current numbering: BR-11, FR-16, NFR-05, AC-36, TEST-27)

| ID | Statement | Verified by |
|---|---|---|
| **BR-12** | An outflow from a Cash account must not make its balance negative. (Lab 7: repayment only.) | AC-37..39 |
| **AC-37** | Repayment of (bank balance + 0.01) is rejected with 400; no transaction/allocation stored; balances unchanged. | TEST-28 |
| **AC-38** | Repayment leaving the bank balance at exactly 0.00 is accepted (201). | TEST-29 |
| **AC-39** | Two competing repayments whose sum exceeds the balance: at most one is stored; balance never < 0. | TEST-30 |
| **AC-40** | The repayment form shows the server's rejection message. | TEST-31 (client) |
| — | Preserved: card overpayment is still accepted. | TEST-32 |

Suggested concrete test data (2-decimal amounts only):
- TEST-28: opening 500.00, card charge 600.00, repay 500.01 → 400, `GET /api/transactions` count unchanged, bank balance still 500.00.
- TEST-29: same setup, repay 500.00 → 201, bank balance "0" / 0.00.
- TEST-30: opening 500.00, fire two repayments of 300.00 with `Promise.all` → exactly one 201 and one 400; bank balance 200.00.
- TEST-31: client mock returns 400 with the message → message visible on the repayment form.
- TEST-32: opening 1000.00, card debt 100.00, repay 300.00 → 201; card balance shows credit (current behavior).

## 4. Impact table (fill in for Part A)

| Item | Affected? | Detail / reason if not applicable |
|---|---|---|
| SRS | Yes | Add BR-12; change-log entry linked to the Issue. |
| Feature contract F-06 | Yes | v1.0 → v1.1: validation section, AC-37..40, tests, DoD. |
| System-Level SDS | Yes (small) | Note: business rule enforced server-side in a DB transaction with a row lock. |
| GLOSSARY.md | Yes | Add term **Overdraft**: a Cash account balance below zero; not permitted. |
| API `POST /api/transactions/repayment` | Yes | New 400 response. |
| Balance computation | Reused | The same formula as `/summaries/balances` → extract one shared helper (no duplicated rule). |
| UI repayment form | Yes | Show the error (AC-40). |
| Roles/ownership | Must not change | Check order (D9); admin still 403; cross-owner still 403. |
| DB schema / migration | N/A | The rule needs no new column. |
| Historical data | N/A | Existing rows untouched; rule applies to new repayments only. Seed never overdraws. |
| F-03 opening balance | Not changed | D4: known limitation. |
| F-04 receive / F-05 payment | Not changed | No Cash outflow in Sprint 1. Regression tests f04/f05 still run. |
| Existing tests | Unchanged | No old expected result needs revision (D9). |

## 5. Git / PR flow (one traceable chain)

Before starting: commit or stash the pending Lab 6 doc changes (`git status` currently shows modified files).

1. **Issue**: "LAB7: Reject repayments that would overdraw the bank account (BR-12)". Include old rule, new rule,
   reason, scope, AC-37..40, boundaries, access expectations, the Sprint 1 baseline and the pre-change commit.
2. **TA approval**: send the Issue link to the TA. Paste/screenshot the reply as an Issue comment (approver name + date).
3. **Branches**: `lab7-staging` from `main`; commit the CI edit directly on it as Lab 7 setup (add `lab7-staging` to `branches:` in `.github/workflows/ci-docker.yml` line 43; no separate Issue, same as Lab 6's `5a61ad3`).
4. **PR-A (contract only)**: branch `LAB7-63-docs/br12-contract` with SRS BR-12, F-06 v1.1, test spec, SDS note, GLOSSARY term.
   **Author: Tana. Reviewer: Thanaphon.** Merge into `lab7-staging` **before any code**.
5. **RED commit**: branch `LAB7-64-change/no-overdraft-repayment` from `lab7-staging` after PR-A merges.
   Commit `test(#64): failing tests for BR-12 no-overdraft repayment (RED)` with TEST-28..32.
   Run against the unchanged code and **save the failure output** (TEST-28 and TEST-30 must fail on the missing rule;
   TEST-29/32 pass and are labelled boundary/preserved guards). **Author: Tana.**
6. **GREEN commit**: `feat(#64): reject repayments that would overdraw the bank account (GREEN)`, with the shared
   balance helper, `$transaction` + `FOR UPDATE` lock on `"Account"`, the check run last, and the UI error display.
   **Author: Thanaphon.**
7. **PR-B** into `lab7-staging`: Tana reviews with a *specific* comment (e.g. checks the lock and the check order). CI must pass.
8. **Release PR** `lab7-staging` → `main` (reviewed). Tag **`v1.1.0`**. The deploy workflow runs; record the Cloud Run revision.
9. **Lab 7 reaches `main` before any Sprint 2 feature does**, so the pre-change commit = the accepted Sprint 1 release + docs only.

## 6. Evidence to capture as you go (screenshots/logs need ID, time, commit/revision)

- Issue + TA approval comment.
- PR-A diff (old/new excerpts of F-06 + BR-12) + review comment + merge time.
- RED run: command, commit hash, failing output.
- GREEN run: the same command, commit hash, passing output + code diff.
- Full regression: `npm test` at the root on the release commit → pass/fail/skip counts (server + client).
  Most relevant suites: `f06-repayment-overview`, `f05-split-payment`, `f01-auth-role-access`, `readiness`.
- CI run IDs for PR-B and the release PR; deploy run ID; Cloud Run revision.
- **Post-deploy checks (manual, curl against Cloud Run, fresh synthetic user registered via F-07):**
  1. Over-balance repayment → 400, balance unchanged (changed behavior).
  2. Repayment to exactly 0.00 → 201 (boundary).
  3. Repayment using another user's bank account → 403 (preserved isolation).
  4. Administrator calling financial endpoints → 403 (preserved admin denial).
  5. Normal journey (opening → salary → card purchase → repayment) still works and persists.

## 7. Version table (Part B / PDF front page)

| Role | Tag / commit | Cloud Run revision |
|---|---|---|
| Accepted Sprint 1 baseline | `v1.0.1-uat` / `83371f7` (CPMS also accepted docs-only `7c68c84`) | `pmels-00009-rwp` |
| Pre-change commit (`lab7-staging` tip before RED) | `8e54792` | — |
| Contract commit (PR-A merge) | `971bb8a` (PR #67) | — |
| RED test commit | `9690c27` | — |
| GREEN implementation commit | `c025078` | — |
| Accepted main release | `v1.1.0` / `8d0d4b18a1c564a05f857fe3d8e34505bcbb1a81` | `pmels-00011-rw4` |

## 8. Part C metrics

Window: **8 Nov 2026 (Sprint 1 release) → snapshot right after the `v1.1.0` deploy** (write the exact time).
Sources: `gh issue list`, `gh pr list`, `gh run list` exported to text and embedded as tables.

1. Completed Issues in the window (IDs + close dates; mark duplicates/cancelled).
2. Merged PRs (IDs, merge dates, target branch).
3. Automated test results: **reuse** the full-suite run on the `v1.1.0` commit (same as Part B).
4. UAT defect status, Lab 6 window (10–22 Nov). "Resolved" = fix merged to `main` + partner re-test PASS.
   UF-01 / #54 = not-defect (operations incident); UF-02 / #55 = accepted minor defect → fixed → partner re-test PASS;
   UF-03 / #56 = enhancement for Sprint 2, not a Sprint 1 defect.
5. CI run outcomes (success/failure/cancelled, workflow + branch scope, run IDs).

Interpretation is at most 100 words and names one concrete risk/action with an owner.
**Owner: Thanaphon writes, Tana reviews.**

## 9. Part D readiness

**Verdict rule:** READY only if the full suite has 0 failures, all post-deploy checks pass, and there is no open
critical/major defect in Sprint 1 scope. Otherwise NOT READY, with an owner/action per gap.

Defect list (known now):
- **Minor, open, deferred to Sprint 2:** `parsePositiveAmount` accepts up to 30 decimal places, while F-05/F-06 say
  "reject over-precision amounts". Not fixed in Lab 7.

Technical debt (known now):

| Item | Impact | Priority | Action |
|---|---|---|---|
| Amount/date validation duplicated (`parsePositiveAmount` vs inline opening-balance code) | Rules can drift apart | Medium | Consolidate in Sprint 2/3 |
| BR-12 enforced only at repayment until Sprint 2 reuses the helper | New Cash outflows could skip it | High | Sprint 2 contracts must reference BR-12 |
| Lowering the opening balance can still make a balance negative (D4) | BR-12 invariant can be broken via F-03 | Medium | Decide in Sprint 3 |

Also: config/secrets check, README/run instructions current, deploy + smoke status, contribution table,
AI-use declaration, retrospective (helped / hurt / will change, one or two sentences each).
**Owner: Tana writes, Thanaphon reviews.**

## 10. Timeline

| Date | Work | Who |
|---|---|---|
| **Mon 23 Nov** | Commit/stash Lab 6 changes; open the Issue; send it to the TA | Tana |
| **≤ Wed 25 Nov** | TA approval recorded; `lab7-staging` + CI edit; PR-A written, reviewed, merged | Tana writes / Thanaphon reviews |
| **Thu 26 Nov** | RED commit + saved output → GREEN commit → PR-B reviewed, CI green, merged | Tana RED / Thanaphon GREEN |
| **Fri 27 Nov** | Release PR → `main`, tag `v1.1.0`, deploy, post-deploy checks, metrics snapshot | Both |
| **Sat 28 Nov** | Parts C + D written; report sources in `docs/labs/lab7/`; build the PDF | Both |
| **Sun 29 Nov** | Buffer + submit. Sprint 2 merges to `main` only **after** `v1.1.0`. | Both |

## 11. Submission checklist (from the handout)

- [ ] Request changes behavior already in Sprint 1; old/new rule stated; Sprint 1 + pre-change versions identified.
- [ ] Impact analysis, revised contract and review come **before** implementation in Git history.
- [ ] Test fails on old code (missing rule, not a compile error), then passes; regression covered.
- [ ] Review → CI → release → deployment checks form one traceable chain.
- [ ] Five metrics reconcilable with embedded sources; interpretation ≤ 100 words.
- [ ] READY/NOT READY for the maintained Sprint 1 scope; three retrospective answers; one self-contained PDF.
- [ ] No real passwords/tokens in the PDF or Git; synthetic data only.
