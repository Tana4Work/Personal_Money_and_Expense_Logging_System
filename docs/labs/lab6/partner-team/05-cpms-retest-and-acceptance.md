# Theme 7 UAT retest results (tester: James, Theme 6 UAT Team)

Product: Personal Money and Expense Logging System (Theme 7)
Release: v1.0.1-uat · commit 83371f7 · Cloud Run revision pmels-00009-rwp
URL: https://pmels-203670311966.asia-southeast1.run.app
Browser: Chrome on Windows (desktop). All times UTC+7. Version text "Lab 5 deployment proof release." observed on the login page before the retest session.
Evidence: screenshots `EV-UAT01-03_83371f7_1448.png`, `EV-UAT01-07_83371f7_1450.png`, `EV-UAT04-05_83371f7_1452.png` and DevTools Network API response captures.

Users: USER-1 `uat-james-retest1@test.local` (Name: `UAT One`, Bank Account id `56`, Credit Card id `57`, Salary id `58`, Dining id `59`, Groceries id `60`).

## Summary

| Case | Session 1 (17 Nov, Kan) | Session 2 (18 Nov, Kan) | Retest session (21 Nov 14:46–14:52, James) | Finding |
|---|---|---|---|---|
| UAT-01 | BLOCKED (UF-01) | FAIL (step 3 only) | **PASS** (UF-02 fixed) | UF-02 (Verified / Closed) |
| UAT-02 | BLOCKED (UF-01) | PASS | – (not affected) | – |
| UAT-03 | BLOCKED (UF-01) | PASS | – (not affected) | – |
| UAT-04 | BLOCKED (UF-01) | PASS | **PASS** (regression check) | – |
| UAT-05 | BLOCKED (UF-01) | PASS | – (not affected) | – |

## Result rows — retest session (2026-11-21)

| Case | Tester / team | Date & time (UTC+7) | Version | Inputs | Actual result | Result | Evidence | Finding |
|---|---|---|---|---|---|---|---|---|
| UAT-01 | James (Chaiyaphoom Chenchirotphiphat), Theme 6 | 2026-11-21 14:46–14:50 | 83371f7 / pmels-00009-rwp | USER-1 "UAT One" (`uat-james-retest1@test.local`, Bank Account id 56); opening 10000 @ 2026-11-01; receive 30000 @ 2026-11-02 Bank/Salary; card 1500 @ 2026-11-03 (Dining 600, Groceries 900); repay 1000 @ 2026-11-04 Bank→Credit Card | Steps 1–2: "Account created successfully. Please sign in."; signed in as UAT One (USER), 5 accounts listed, all overview cards 0, "No transactions recorded yet." Step 3 (UF-02 retest): immediately after Save balance (no reload, no extra transaction), BANK BALANCE overview card updated to 10000, Bank Account row showed Opening balance 10000, As-of 2026-11-01, and Current balance 10000 (Income 0); live `GET /api/summaries/balances` returned 200 with `{"accounts":[{"accountId":56,"balance":"10000"},{"accountId":57,"balance":"0"},{"accountId":59,"balance":"0"},{"accountId":60,"balance":"0"},{"accountId":58,"balance":"0"}]}`. Step 4: "Money received successfully.", Bank 40000, Income 30000, Expenses 0. Step 5: "Payment recorded successfully.", Credit-card debt 1500, Expenses 1500, Bank 40000. Step 6: "Repayment recorded successfully.", Bank 39000, Credit-card debt 500, Income 30000, Expenses 1500. Step 7: Bank Account Current balance 39000, Credit Card -500; history has 3 rows newest first (2026-11-04 Payment/charge 1000 Credit Card: 1000; 2026-11-03 Payment/charge 1500 Dining 600, Groceries 900; 2026-11-02 Received money 30000 Salary: 30000). | PASS | EV-UAT01-03_83371f7_1448, EV-UAT01-07_83371f7_1450 | UF-02 (Fixed) |
| UAT-04 | James (Chaiyaphoom Chenchirotphiphat), Theme 6 | 2026-11-21 14:50–14:52 | 83371f7 / pmels-00009-rwp | USER-1 (`uat-james-retest1@test.local`) after UAT-01 | Step 1: Reload kept UAT One signed in with Bank 39000, Credit-card debt 500, Income 30000, Expenses 1500, same 3 history rows. Step 2: Active 43-char session token captured before logout. Step 3: Log out (`POST /api/auth/logout` 204) returned to login page. Step 4: `GET /api/accounts` with old Bearer token returned `401 {"error":"Authentication is required."}` with no data. Step 5: Signed in again; same overview values (Bank 39000, Debt 500, Income 30000, Expenses 1500), Bank Account opening balance 10000 as-of 2026-11-01, all 3 history rows with allocation lines intact. | PASS | EV-UAT04-05_83371f7_1452 | – |

## Finding retest status

| ID | Original finding | Retest result / disposition (2026-11-21) | Status | Evidence |
|---|---|---|---|---|
| UF-01 | Registration and login returned 500 on 17 Nov 21:23 (Cloud SQL paused; Issue #54) | Database restarted on 18 Nov on the same release (`v1.0.0-uat` / `d5cbb13` / `pmels-00008-85b`); Session 2 ran cleanly with no code change. | Not re-tested: not-defect (#54) | EV-UAT01-01_d5cbb13_2123 |
| UF-02 | Bank balance card and Current balance stayed 0 after saving opening balance (UAT-01 step 3, D-01; Issue #55) | Both BANK BALANCE card and Bank Account Current balance updated immediately to `10000` after saving opening balance `10000` (`2026-11-01`), matching `GET /api/summaries/balances` (`200`). No regression in UAT-01 steps 4–7 or UAT-04. | Closed (Verified fixed on `v1.0.1-uat` / `83371f7` / `pmels-00009-rwp`) | EV-UAT01-03_83371f7_1448, EV-UAT01-07_83371f7_1450, EV-UAT04-05_83371f7_1452 |
| UF-03 | Current balance shows 0 for Dining, Groceries and Salary (UAT-01 step 7; Issue #56) | Confirmed 0 is specified Sprint 1 behaviour; category summaries deferred to Sprint 2. | Not re-tested: enhancement (#56) | EV-UAT01-07_d5cbb13_1348 |

## Sprint 1 acceptance decision (Section 7)

| Field | Entry |
|---|---|
| UAT Team | Phacharawat Eakgawatphokhin · ID 67070503426 · GitHub: KanPhacharawat<br/>Chaiyaphoom Chenchirotphiphat · ID 67070503410 · GitHub: maneejames<br/>Theme 6, Course Project Management System (CPMS) |
| Release accepted or rejected | `v1.0.1-uat`; commit `83371f7`; Cloud Run revision `pmels-00009-rwp` |
| Cases run on this release | **UAT-01, UAT-04**: PASS on `v1.0.1-uat` (`83371f7` / `pmels-00009-rwp`) on 21 Nov 2026 (James) as re-test and regression.<br/>**UAT-02, UAT-03, UAT-05**: PASS on `v1.0.0-uat` (`d5cbb13` / `pmels-00008-85b`) on 18 Nov 2026 (Kan); not re-run because the #55 fix changes only the client refresh after saving an opening balance (no API, data or access change). |
| Findings re-tested | **UF-02** (D-01, Minor, #55) — verified fixed on `v1.0.1-uat` (`83371f7` / `pmels-00009-rwp`) on 21 Nov 2026 (UAT-01 step 3 & UAT-04).<br/>**UF-01** (#54) — not re-tested: not-defect.<br/>**UF-03** (#56) — not re-tested: enhancement. |
| Decision | **Accepted** |
| Date and time of decision | 21 Nov 2026, 14:52 (UTC+7) |
| Accepted minor limitations | none |
| Signatures (both testers) | Phacharawat Eakgawatphokhin (Kan, `KanPhacharawat`) — 21 Nov 2026<br/>Chaiyaphoom Chenchirotphiphat (James, `maneejames`) — 21 Nov 2026 |
