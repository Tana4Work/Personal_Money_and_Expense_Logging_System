# Triage of UAT findings UF-01 to UF-03 (Personal Money and Expense Logging System, Sprint 1)

**Date:** 20 November 2026
**To:** Kan and James, CPMS team (Theme 6), our UAT Team
**From:** Tana Udompornkul (67070503418) and Thanaphon Ratchatakulpong (67070503417), PMELS Product Team (Theme 7)
**Release tested:** `v1.0.0-uat` · commit `d5cbb13` · Cloud Run revision `pmels-00008-85b`

Thank you for the detailed results and the console log. We triaged all three findings against our Sprint 1 contract. Summary:

| ID | Your proposed severity | Our classification | Agreed severity | Action | GitHub Issue |
|---|---|---|---|---|---|
| UF-01 | Major | **Not-defect** (operations incident on our side; root cause confirmed) | Major impact, no code change | Database restarted; process change; no redeploy | #54 |
| UF-02 | Minor | **Accepted defect** (our known issue D-01) | Minor | Fix with a failing test first, review, CI, redeploy, then your re-test of UAT-01 | #55 |
| UF-03 | Enhancement | **Enhancement** | — | Planned for Sprint 2 category summaries; no Sprint 1 change | #56 |

---

## UF-01: Registration and login returned 500 on 17 Nov 21:23

**Classification:** Not-defect: an operations incident caused by us, not by the application code.

**Root cause (confirmed):** we paused our Cloud SQL instance (`pmels-pg`) to save credits, following Section 9 of the GCP guide, and did not restart it before your session. When we checked on 18 Nov 11:10, `gcloud sql instances describe pmels-pg` returned activation policy `NEVER` and state `STOPPED`. Every request that needs the database therefore failed, which matches what you saw: registration and login returned 500 while `/api/health` (no database) returned 200.

**What we did:** restarted the instance on 18 Nov 2026 around 11:10 (UTC+7) with `--activation-policy=ALWAYS`. Our readiness check `GET /api/ready` returned `{"status":"ready","db":"connected"}` at 11:10.

**Your question about a redeploy:** nothing was redeployed. The application was not changed. Your session 2 ran on the same commit `d5cbb13` and revision `pmels-00008-85b` as the handoff, so both sessions tested the same release.

**Reason it is not a code defect:** the application behaved correctly for a missing database. It refused the requests and stored nothing. The failure came from our operating decision, not from F-01 or F-07 logic. We accept the impact you report (Major: no workaround for you that evening) and apologise for the lost session.

**Process change:** we will not pause the database or the service until all UAT and re-tests with you are complete. We will also check `GET /api/ready` before telling you a release is ready.

**Follow-up (not part of this fix):** the app returned a generic 500 ("Unable to complete the request.") instead of a clearer "service temporarily unavailable" message when the database was down. We will log this as a Sprint 3 hardening item.

**Your result rows:** your session 1 rows are correct as **BLOCKED (UF-01)**. Your session 2 rows on the same release stand, so no further re-test is needed for UF-01.

---

## UF-02: Bank balance card and Current balance stay 0 after saving an opening balance

**Classification:** Accepted defect. This is the known issue **D-01** we disclosed in section 4 of the handoff.

**Severity:** Minor, as you proposed. The stored data is correct: your log shows `GET /api/summaries/balances` already returning `10000` for account 31 while the screen showed 0. Only the display is stale until the next transaction.

**Contract reference:** AC-12 (the opening balance is reflected in the account's current balance) and AC-34 (the overview shows the bank balance). The screen does not meet these immediately after saving.

**Cause:** after saving an opening balance, the page refreshes the accounts table but not the balance figures used by the overview cards and the Current balance column. The other three forms refresh both.

**Fix plan:**

1. Add an automated test that saves an opening balance and expects the Bank balance card to show the new value. It must fail on the current code first (red).
2. Fix the page so it reloads the balances after saving (green), then run the full regression suite.
3. Teammate-reviewed pull request into our staging branch, CI checks, release to `main`, automatic deployment, and post-deploy smoke checks.
4. Send you the new commit, Cloud Run revision and tag.

**Re-test we will ask for:** UAT-01 in full on the fixed release, especially step 3, where Bank balance and Current balance must show 10000 immediately. UAT-04 continues from UAT-01, so please re-run it too to confirm nothing regressed. Please record new result rows; keep your original rows unchanged.

---

## UF-03: Current balance shows 0 for Dining, Groceries and Salary

**Classification:** Enhancement.

**Reason:** the Current balance column shows money moved into or out of an account (opening balance + money received − money paid out). Income and expense category accounts are never the source or the destination of a transaction; they only receive allocation lines. So 0 is the specified Sprint 1 behaviour. The category totals you expected are already correct in the overview: Income 30000 and Expenses 1500 in your run. Your report also notes that Sprint 1 does not specify this.

**Plan:** we agree the column is confusing for category accounts. Category spending and income summaries are already planned for Sprint 2. We will consider your suggestion there: either show category totals or hide the Current balance column for INCOME and EXPENSE accounts. There is no Sprint 1 change and no re-test.

---

## Next steps

| Step | Who | When |
|---|---|---|
| Fix UF-02 (D-01) and deploy the corrected release | PMELS team | By 21 Nov 2026 |
| Send you the corrected commit, revision and cases to re-run | PMELS team | When deployed |
| Re-test UAT-01 and UAT-04; record the final acceptance decision in section 7 of our handoff | CPMS team (both testers) | By 22 Nov 2026 |

If you disagree with any classification above, please reply with your reason and we will discuss it before the re-test.
