# Theme 7 UAT results (tester: Kan, Theme 6 UAT Team)

Product: Personal Money and Expense Logging System (Theme 7)
Release: v1.0.0-uat · commit d5cbb13 · Cloud Run revision pmels-00008-85b (as in the handoff; no new revision was announced after the 17 Nov outage was fixed — confirm with the Product Team)
URL: https://pmels-203670311966.asia-southeast1.run.app
Browser: Chrome on Windows (desktop). All times UTC+7. Version text "Lab 5 deployment proof release." checked on the login page before both sessions (EV-UAT01-00).
Evidence: screenshots `EV-<case>-<step>_d5cbb13_<HHMM>.png` (page area only; the URL is recorded in the console log) and console/API captures in `EV-UAT-console-log.txt`.

Users: USER-1 uat-kan-1, USER-2 uat-kan-2, USER-3A uat-kan-3a, USER-3B uat-kan-3b, USER-5 uat-kan-5 (all @test.local); ADMIN-01 system.admin@money.local. Only USER-5 was disabled and re-enabled; every user ended Enabled.

## Summary

| Case | Session 1 (17 Nov 21:23) | Session 2 (18 Nov 13:44–14:22) | Finding |
|---|---|---|---|
| UAT-01 | BLOCKED (UF-01) | FAIL (step 3 only) | UF-02 |
| UAT-02 | BLOCKED (UF-01) | PASS | – |
| UAT-03 | BLOCKED (UF-01) | PASS | – |
| UAT-04 | BLOCKED (UF-01) | PASS | – |
| UAT-05 | BLOCKED (UF-01) | PASS | – |

## Result rows — session 1 (2026-11-17)

| Case | Tester / team | Date & time (UTC+7) | Version | Inputs | Actual result | Result | Evidence | Finding |
|---|---|---|---|---|---|---|---|---|
| UAT-01 | Kan, Theme 6 | 2026-11-17 21:23 | d5cbb13 / pmels-00008-85b | Register USER-1 "UAT One", uat-kan-1@test.local | Create account showed the red alert "Unable to complete the request." on 4 attempts; POST /api/auth/register returned 500. No user could be created, so steps 2-7 could not run. | BLOCKED (server error at step 1) | EV-UAT01-01_d5cbb13_2123 | UF-01 |
| UAT-02 | Kan, Theme 6 | 2026-11-17 21:23 | d5cbb13 / pmels-00008-85b | USER-2 not created | Not started: registration impossible while UF-01 was open. | BLOCKED (UF-01) | EV-UAT01-01_d5cbb13_2123 | UF-01 |
| UAT-03 | Kan, Theme 6 | 2026-11-17 21:23 | d5cbb13 / pmels-00008-85b | USER-3A/3B not created | Not started: needs two registered users. | BLOCKED (UF-01) | EV-UAT01-01_d5cbb13_2123 | UF-01 |
| UAT-04 | Kan, Theme 6 | 2026-11-17 21:23 | d5cbb13 / pmels-00008-85b | Depends on UAT-01 | Not started: UAT-01 blocked. | BLOCKED (UF-01) | EV-UAT01-01_d5cbb13_2123 | UF-01 |
| UAT-05 | Kan, Theme 6 | 2026-11-17 21:23 | d5cbb13 / pmels-00008-85b | USER-5 not created | Not started: USER-5 could not be registered. | BLOCKED (UF-01) | EV-UAT01-01_d5cbb13_2123 | UF-01 |

## Result rows — session 2 (2026-11-18)

| Case | Tester / team | Date & time (UTC+7) | Version | Inputs | Actual result | Result | Evidence | Finding |
|---|---|---|---|---|---|---|---|---|
| UAT-01 | Kan, Theme 6 | 2026-11-18 13:44–13:48 | d5cbb13 / pmels-00008-85b | USER-1 "UAT One"; opening 10000 @ 2026-11-01; receive 30000 @ 2026-11-02 Bank/Salary; card 1500 @ 2026-11-03 (Dining 600, Groceries 900); repay 1000 @ 2026-11-04 Bank→Credit Card | Steps 1-2: new user sees 5 accounts, all cards 0, "No transactions recorded yet." Step 3: table shows opening 10000 and as-of 2026-11-01, but the Bank balance card and the Bank Current balance both stay 0 (API /api/summaries/balances already returns 10000 for the bank account). Step 4: "Money received successfully.", Bank 40000, Income 30000, Expenses 0 (display caught up). Step 5: "Payment recorded successfully.", debt 1500, Expenses 1500, Bank 40000. Step 6: "Repayment recorded successfully.", Bank 39000, debt 500, Income 30000, Expenses 1500. Step 7: Bank 39000, Credit Card -500; history 3 rows newest first (11-04 Payment/charge 1000 Credit Card: 1000; 11-03 Payment/charge 1500 Dining 600 / Groceries 900; 11-02 Received money 30000 Salary 30000). | FAIL (step 3 only; known issue D-01) | EV-UAT01-02, -03, -04, -05, -06, -07 (_d5cbb13_1346–1348), console log EV-UAT01-03c | UF-02 |
| UAT-02 | Kan, Theme 6 | 2026-11-18 14:11 | d5cbb13 / pmels-00008-85b | USER-2 "UAT Two"; card 1500 @ 2026-11-03 with Dining 600 + Groceries 800, then 899.99, then 900 | Lines 1400 and 1499.99 both gave the red alert "Allocation total must equal the transaction total."; the second was rejected by the server (POST /api/transactions/payment 400). Debt 0, Expenses 0, history empty after both. GET /api/transactions → 200 []. Reload kept me signed in with all 0. Control 600+900 → "Payment recorded successfully.", debt 1500, Expenses 1500, exactly 1 row. | PASS | EV-UAT02-01, -02, -04, -05 (_d5cbb13_1411), console log EV-UAT02-03 | – |
| UAT-03 | Kan, Theme 6 | 2026-11-18 14:12–14:18 | d5cbb13 / pmels-00008-85b | USER-3B card 1500 (B_BANK 41, B_CARD 42, B_TX 24); USER-3A (A_BANK 46, A_SALARY 48); ADMIN-01 | B: 5 accounts + 1 transaction. A sees only own accounts 46-50. A → GET /api/accounts/41: 403 "Account access is not allowed."; GET /api/transactions/24: 403 "Transaction access is not allowed."; repayment into 42: 403 "Credit-card account access is not allowed."; receive into 41: 403 "Receiving account access is not allowed." No data fields in any refusal. After reload A is all 0 with no history; B still debt 1500, Expenses 1500, exactly 1 transaction. Admin sees only the User administration table (Name, Email, Role, Status), no cards/accounts/history; GET /api/accounts, /transactions, /summaries, /summaries/balances, /transactions/24 → each 403 "User access is required."; GET /api/admin/users → 200 with keys id, name, email, role, enabled, createdAt only (no passwordHash). | PASS | EV-UAT03-01, -03, -08, -09, -10 (_d5cbb13_1412–1418), console log EV-UAT03-02..12 | – |
| UAT-04 | Kan, Theme 6 | 2026-11-18 13:47–14:05 | d5cbb13 / pmels-00008-85b | USER-1 after UAT-01 | Reload: still UAT One, Bank 39000, debt 500, Income 30000, Expenses 1500, same 3 rows. oldToken read (43-char string, no error). Log out → login page. fetch /api/accounts with oldToken → 401 "Authentication is required." Signed in again: same values, opening 10000 as-of 2026-11-01, 3 rows with allocations Credit Card 1000 / Dining 600 + Groceries 900 / Salary 30000. | PASS | EV-UAT04-01, -03, -05 (_d5cbb13_1347–1405), console log EV-UAT04-02, -04 | – |
| UAT-05 | Kan, Theme 6 | 2026-11-18 14:14–14:22 | d5cbb13 / pmels-00008-85b | USER-5 "UAT Five" receive 5000 @ 2026-11-02 Bank/Salary; ADMIN-01; wrong password; nobody-kan@test.local | USER-5 Bank 5000, Income 5000, 1 row; GET /api/admin/users → 403 "Administrator access is required." Admin table showed USER-5 Enabled with Disable; after Disable (USER-5 row only) it showed Disabled / Enable. USER-5's open tab: GET /api/accounts → 401 "Authentication is required."; reload → login page. Correct password, wrong password and unknown email all gave the same red alert "Invalid email or password." (401). After Enable: Enabled; USER-5 signed in, Bank 5000, Income 5000, same 1 row. | PASS | EV-UAT05-01, -03, -04, -06, -07, -08a, -08b, -09, -10 (_d5cbb13_1414–1422), console log EV-UAT05-02, -05 | – |

## Finding rows

| ID | Reporter | Version | Case / step | Preconditions & data | Steps to reproduce | Expected | Actual | Proposed severity | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| UF-01 | Kan, Theme 6 | d5cbb13 / pmels-00008-85b | UAT-01 step 1 (blocked UAT-02..05) on 2026-11-17 21:23 | No session; new email uat-kan-1@test.local; valid synthetic password | 1. Open the URL. 2. Create a new account. 3. Enter Name, Email, Password. 4. Create account. (Also POST /api/auth/login with unknown email.) | Account created; unknown-email login gives 401 "Invalid email or password." | "Unable to complete the request."; POST /api/auth/register 500 (x4); POST /api/auth/login also 500; GET /api/health 200. Looked like a database/connection outage. Working again on 2026-11-18 13:44 with no new revision announced. | Major (F-01/F-07 could not be completed, no workaround). Please confirm root cause and whether anything was redeployed. | EV-UAT01-01_d5cbb13_2123 (.txt) |
| UF-02 | Kan, Theme 6 | d5cbb13 / pmels-00008-85b | UAT-01 step 3 (known issue D-01) | USER-1 uat-kan-1@test.local, Bank Account id 31, fresh user with no transactions | 1. Sign in as a new user. 2. Opening balance for Bank Account: 10000, date 2026-11-01. 3. Save balance. | Bank balance card 10000 and Bank Account Current balance 10000 (AC-12/AC-34). | Opening balance 10000 and as-of 2026-11-01 appear in the table, but the Bank balance card and Current balance stay 0. GET /api/summaries/balances already returns 10000 for account 31, so stored data is correct. The display corrects itself only after the next transaction (Bank 40000 after step 4). | Minor (stale display; stored data correct; workaround: record another transaction; reload not tested) | EV-UAT01-03_d5cbb13_1347, console log EV-UAT01-03c |
| UF-03 | Kan, Theme 6 | d5cbb13 / pmels-00008-85b | UAT-01 step 7 (observation) | USER-1 after UAT-01 | Complete UAT-01 and read the accounts table. | Not specified in the Sprint 1 contract. | Current balance for Dining, Groceries and Salary stays 0 although they hold 600, 900 and 30000 of allocations. Overview Income/Expenses totals are correct. | Enhancement (outside the cases' expected results; suggest showing category totals or hiding the column for EXPENSE/INCOME accounts) | EV-UAT01-07_d5cbb13_1348 |

Note for Kan: UF-03 is optional. Remove it before pasting if you'd rather not raise an enhancement.
