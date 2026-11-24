# Lab 7 Issues and Branches

**Group:** EN-008 JOmmy (Theme 7: Personal Money and Expense Logging System)
**Members:** Tana Udompornkul (67070503418), Thanaphon Ratchatakulpong (67070503417)
**Repo:** https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System

The Lab 7 GitHub Issues are #62–#66; the issue and branch references below use those numbers.
Open the Issues in the order below. Only Issue 1 must exist (and be sent to the TA) before approval;
open Issues 2–5 after approval, and start no branch before approval.

## Overview

| # | Issue title | Labels | Branch (from) | PR into | Author → Reviewer | When |
|---|---|---|---|---|---|---|
| 1 | LAB7 CR: Reject repayments that would overdraw the bank account (BR-12) | `lab7`, `change-request` | — (parent Issue, holds the TA approval) | — | Tana opens | 23 Nov |
| 2 | LAB7: Revise SRS/F-06 contract for BR-12 (AC-37–40, TEST-28–32) | `lab7`, `docs`, `contract` | `LAB7-63-docs/br12-contract` (from `lab7-staging`) | `lab7-staging` | Tana → Thanaphon | ≤ 25 Nov |
| 3 | LAB7: Implement BR-12 no-overdraft repayment (RED → GREEN) | `lab7`, `change` | `LAB7-64-change/no-overdraft-repayment` (from `lab7-staging`, **after #63 merges**) | `lab7-staging` | RED: Tana, GREEN: Thanaphon → Tana reviews | 26 Nov |
| 4 | LAB7: Release v1.1.0 and post-deployment checks | `lab7`, `release` | none: release PR `lab7-staging` → `main` | `main` | Thanaphon → Tana | 27 Nov |
| 5 | LAB7: Lab 7 report (metrics, readiness, retrospective, PDF) | `lab7`, `docs` | `LAB7-66-docs/lab7-report` (from `lab7-staging`) | `lab7-staging` (then `main`) | Metrics: Thanaphon, Readiness: Tana; cross-review | 28 Nov |

Branch `lab7-staging` is created from `main` (no Issue needed). Its first commits, made directly on `lab7-staging` as Lab 7 setup (same as `5a61ad3` did for Lab 6):
1. `docs(lab7): add Lab 7 plan and issue list (#62)`: `docs/labs/lab7/lab7_plan.md` + this file.
2. `ci: run PR checks on lab7-staging (Lab 7 setup, #62)`: add `lab7-staging` to `pull_request.branches` in `.github/workflows/ci-docker.yml` (line 43). **Required:** without it, PRs into `lab7-staging` get no CI run and Part B loses its CI evidence.

---

## Issue 1 — LAB7 CR: Reject repayments that would overdraw the bank account (BR-12)

**Type:** Change request (Lab 7 maintenance: requirement change, not a defect)
**Group:** EN-008 JOmmy — Tana Udompornkul (67070503418), Thanaphon Ratchatakulpong (67070503417)

### Original Sprint 1 requirement and implemented behavior
- Feature **F-06 Credit-card Repayment and Financial Overview**, AC-30–AC-36.
- `POST /api/transactions/repayment` accepts any valid positive amount from the user's own bank account to their own
  credit card. No balance check exists, so the bank balance can become negative
  (e.g. bank 100.00, repayment 5,000.00 → accepted, bank −4,900.00).
- **Accepted Sprint 1 baseline:** tag `v1.0.1-uat`, commit `83371f7`, Cloud Run revision `pmels-00009-rwp`
  (CPMS acceptance, 21 Nov 2026; also covers docs-only commit `7c68c84`).
- **Pre-change implementation:** `server/src/app.ts`, repayment route (~line 317), at the `lab7-staging` tip before the RED commit (commit recorded in #64).

### Proposed new rule — BR-12
An outflow from a Cash account must not make its balance negative. **Lab 7 scope: repayment only.**
- A repayment that would leave the source bank balance **below 0.00** is rejected; exactly **0.00** is accepted.
- Balance = current all-time balance (opening balance + incoming − outgoing), as shown by `GET /api/summaries/balances`.

### Reason
The tracker accepts repayments larger than the money in the bank, which hides data-entry mistakes and shows
impossible balances. This is a product-owner decision to tighten the rule.

### Acceptance criteria
- **AC-37:** Repayment of balance + 0.01 → HTTP 400 `{ "error": "Insufficient bank balance for this repayment." }`; no transaction/allocation stored; balances unchanged.
- **AC-38:** Repayment leaving exactly 0.00 → 201.
- **AC-39:** Two competing repayments whose sum exceeds the balance → at most one stored; balance never < 0.
- **AC-40:** The repayment form shows the rejection message.

### Boundaries, invalid cases, access
- Boundary: balance 500.00 → repay 500.00 accepted, 500.01 rejected.
- Existing validation is unchanged (zero/negative/malformed amount, invalid date, wrong account types → 400).
- The balance check runs **after** auth and ownership checks: another user's account → 403 (never a balance message);
  unauthenticated → 401; Administrator → 403.
- Unchanged: card overpayment is still accepted; F-03/F-04/F-05 behavior; no DB migration.
- Out of scope / known limitation: lowering the opening balance (F-03) can still make a balance negative.

### Approval
- [x] Instructor/TA approval — approver: Supachok Deetaweesukh; evidence posted to Issue #62 on 24 Nov 2026 (email screenshot attached).

### Linked work
#63 contract, #64 implementation, #65 release, #66 report (CI setup commit on `lab7-staging`)

---

## Issue 2 — LAB7: Revise SRS/F-06 contract for BR-12 (AC-37–40, TEST-28–32)

Part of #62. **Must merge before any code change (#64).**
- SRS: add **BR-12** + change-log entry linking #62.
- `docs/sprints/sprint-1/F-06-repayment-overview.md` v1.0 → v1.1: validation, AC-37–AC-40, tests, DoD.
- STS: TEST-28 (AC-37), TEST-29 (AC-38), TEST-30 (AC-39), TEST-31 (AC-40, client), TEST-32 (preserved: card overpayment accepted), with inputs, preconditions and expected results.
- System-Level SDS note: rule enforced server-side in one DB transaction with a source-account row lock.
- `GLOSSARY.md`: add **Overdraft**.
- Impact table (see `docs/labs/lab7/lab7_plan.md` §4).
- **Done when:** PR reviewed by the teammate with a specific comment, then merged into `lab7-staging`.
- Branch: `LAB7-63-docs/br12-contract`. Author Tana, reviewer Thanaphon.

---

## Issue 3 — LAB7: Implement BR-12 no-overdraft repayment (RED → GREEN)

Part of #62. Contract: #63 (must be merged first).
1. **RED** (Tana): commit `test(#64): failing tests for BR-12 no-overdraft repayment (RED)` with TEST-28–32.
   Run on the unchanged code; save the command, commit hash and failing output (TEST-28, TEST-30 fail on the missing rule;
   TEST-29, TEST-32 pass as guards).
2. **GREEN** (Thanaphon): commit `feat(#64): reject repayments that would overdraw the bank account (GREEN)`:
   shared balance helper, `prisma.$transaction` + `SELECT ... FOR UPDATE` on the source `"Account"` row,
   check run last, UI error display.
3. Run the full suite (`npm test` at the root); record pass/fail/skip counts.
- **Done when:** PR reviewed by Tana with a specific comment, CI green, merged into `lab7-staging`.
- Branch: `LAB7-64-change/no-overdraft-repayment`.

---

## Issue 4 — LAB7: Release v1.1.0 and post-deployment checks

Part of #62.
- Release PR `lab7-staging` → `main` (reviewed). Tag **`v1.1.0`**. Record the deploy run ID and Cloud Run revision.
- **Merge before any Sprint 2 feature reaches `main`.**
- Post-deployment checks (manual, curl against Cloud Run, fresh synthetic user):
  1. over-balance repayment → 400, balance unchanged
  2. repayment to exactly 0.00 → 201
  3. another user's bank account → 403
  4. Administrator on financial endpoints → 403
  5. normal journey (opening → salary → card purchase → repayment) persists
- **Done when:** all five checks are recorded with time + revision, and the version table is filled in.

---

## Issue 5 — LAB7: Lab 7 report (metrics, readiness, retrospective, PDF)

Part of #62.
- Part C (Thanaphon): five metrics, window 8 Nov → snapshot after the `v1.1.0` deploy; `gh` exports embedded; interpretation ≤ 100 words.
- Part D (Tana): readiness checklist + verdict rule, defect list (30-decimal-place acceptance: minor, open), debt table, retrospective.
- Contribution table, AI-use declaration, known limitations, version table, contents table.
- Report sources in `docs/labs/lab7/`; PDF built on 28 Nov; submit by 29 Nov 23:59.
- **Done when:** the PDF is submitted on LEB2 and each part is reviewed by the other member.
