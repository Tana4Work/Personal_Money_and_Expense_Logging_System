# Re-test request: UF-02 fix (PMELS, Theme 7)

Hi Kan and James,

We have fixed **UF-02** (Issue #55), the bank balance that stayed at 0 after saving an opening balance. The fix is now live on the same URL you tested before. Could you please re-run **UAT-01** and **UAT-04** on the new release and then record your final Sprint 1 decision?

## What we fixed

| | |
|---|---|
| Finding | UF-02: after **Save balance**, the Bank balance card and the Bank Account's Current balance stayed 0 until the next transaction (our known issue D-01) |
| Cause | Saving an opening balance refreshed only the accounts table. The receive, payment and repayment forms refresh everything. |
| Fix | Saving an opening balance now also reloads balances, the income/expense summary and the history, so the screen updates immediately |
| Scope | Client screen only. No change to the API, the database or stored data. |
| Tests | New automated test for UF-02: failed before the fix (`a08ad14`) and passes after it (`e88988c`). The full client suite passes (9/9). |
| Review and release | Fix PR #57 into `lab6-staging` (teammate-reviewed, CI passed), then release PR #58 into `main` |

The other two findings need no re-test: **UF-01** was our database being stopped (no code change), and **UF-03** is an enhancement planned for Sprint 2. See our triage reply.

## Release to test

| Item | Value |
|---|---|
| URL | https://pmels-203670311966.asia-southeast1.run.app (unchanged) |
| Tag | `v1.0.1-uat` |
| Commit | `83371f70a93856e349b84a124ff4712022783ee8` (`83371f7`) |
| Cloud Run revision | `pmels-00009-rwp` (Deploy demo run #6) |
| Deployed | 20 Nov 2026 by GitHub Actions "Deploy demo" after PR #58 |
| Ready check | Open `/api/ready` first: it must show `{"status":"ready","db":"connected"}`. If it does not, message us before testing. |

Your earlier results on `v1.0.0-uat` (`d5cbb13`) stay as they are. Please record the re-test as **new rows** for the version above.

## Accounts

Use the same handoff (sections 2 and 3) and the same admin password as before.

Please **register a fresh user** for this re-test, because `uat-kan-1` already has data. Use, for example, `uat-<yourname>-r1@test.local`. A new user starts with every balance at 0, which UAT-01 needs.

It would be great if **both of you** take part: for example, one runs UAT-01 and the other checks UAT-04 and the evidence. The lab asks both testers to be involved.

## Cases to re-run

### UAT-01: complete money journey (full case, all 7 steps)

Run it exactly as in the handoff, with the same amounts and dates. **Step 3 is the one that failed before.**

| Step 3 action | Expected now |
|---|---|
| Opening balance for Bank Account: amount `10000`, date `2026-11-01`, **Save balance** | Without any other transaction or reload: **Bank balance card = 10000**, Bank Account **Current balance = 10000**, opening balance 10000, as-of 2026-11-01, Income still 0 |

Steps 4–7 should give the same results as your 18 Nov run: final Bank 39000, Credit-card debt 500, Income 30000, Expenses 1500, and 3 history rows.

### UAT-04: saved data survives reload, logout and sign-in

Continue with the same user straight after UAT-01, exactly as in the handoff. This checks that the fix did not change what is stored: the same 39000 / 500 / 30000 / 1500 after reload and after signing in again, and the old token gets 401 after logout.

### Optional extra check (UF-02 regression)

After UAT-04, save the opening balance again with `12000` and date `2026-11-01`. The Bank balance card and Current balance should change straight away from 39000 to **41000** (the opening balance is replaced: 12000 + 30000 − 1000).

## Please record

For each case:
- tester name and team
- date and time (UTC+7)
- version (commit + revision)
- inputs
- actual result in your own words
- PASS / FAIL / BLOCKED
- evidence ID

If anything fails, send a finding row as before, and we will triage it.

## Your final decision

After the re-test, please fill in **section 7 (Sprint 1 acceptance decision)** of our handoff:

- which release you accepted or rejected (tag, commit, revision)
- date and time
- results of the re-run cases
- finding IDs you re-tested
- your decision: **Accepted**, **Accepted with documented minor limitations** or **Not Accepted**
- any limitations you accept
- signatures from both testers

## Timing

Lab 6 is due **22 Nov at 23:59**. Could you re-test by **22 Nov, 12:00**? Then we both have time to finish our reports. Tell us a time that suits you. We will not deploy anything to this URL until you have finished.

Thank you! 🙏
Tana and Thanaphon (PMELS, Theme 7)
