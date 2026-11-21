# Lab 6 UAT Handoff — Personal Money and Expense Logging System (Sprint 1)

2026-11-16 · @Tana

## 1. Release under test

Please test release **v1.0.0-uat** at the URL below, against the Sprint 1 acceptance criteria only. Product Team: Thanaphon Ratchatakulpong (67070503417) and Tana Udompornkul (67070503418), Theme 7.

| Item | Value |
| --- | --- |
| Application URL | https://pmels-203670311966.asia-southeast1.run.app |
| Release tag | `v1.0.0-uat` |
| Commit on `main` | `d5cbb13b7da0d81aa91902aa0810a6bf6f59dfad` (PR #45, Deploy demo run #5, 15 Nov 2026) |
| Cloud Run revision | `pmels-00008-85b` (serving 100% of traffic; image digest `sha256:e0f866b7…`) |
| Repository | https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System |
| Sprint 1 contract | Deliverable 1 report, Part E (F-01 to F-07, AC-01 to AC-36, F07-AC-01 to F07-AC-07) |

**Version check before you start:** the login page shows the text "Lab 5 deployment proof release." If it does not, stop and message us.

**In scope (Sprint 1):** sign in, sign out and current identity (F-01); the five standard financial accounts per user (F-02); opening balance for the bank account (F-03); Receive money (F-04); Record card payment split into Dining and Groceries (F-05); Repay credit card and the financial overview (F-06); self-registration of a normal user (F-07); Administrator enable/disable of users.

**Out of scope:** creating or renaming financial accounts, loans given or taken, transfers, transaction editing, search and filtering, favorites, duplicate, reports. These are Sprint 2 and 3 features; please do not report their absence.

**Freeze rule:** we will not deploy to this URL during the agreed test session. If we must deploy a fix, we will message you first with the new commit and revision, and the cases you should re-run.

## 2. Test accounts, setup and reset

You create your own normal users through **Create a new account** on the login page. We send you only the Administrator password, privately (not in this document).

| Label | Email | Role | How you get it | Used in |
| --- | --- | --- | --- | --- |
| ADMIN-01 | `system.admin@money.local` | ADMINISTRATOR | Password sent privately by the Product Team | UAT-03, UAT-05 |
| USER-1 | `uat-<yourname>-1@test.local` | USER | Register it yourself | UAT-01, UAT-04 |
| USER-2 | `uat-<yourname>-2@test.local` | USER | Register it yourself | UAT-02 |
| USER-3A | `uat-<yourname>-3a@test.local` | USER | Register it yourself | UAT-03 (user A) |
| USER-3B | `uat-<yourname>-3b@test.local` | USER | Register it yourself | UAT-03 (user B) |
| USER-5 | `uat-<yourname>-5@test.local` | USER | Register it yourself | UAT-05 |

Replace `<yourname>` with the tester's first name, so the two testers never share a user. Choose any synthetic password with at least 8 characters, one capital letter and one special character (for example a password manager value). Do not use a real password you use elsewhere.

**What a new user starts with:** five financial accounts, all at 0 — Bank Account (CASH/BANK), Credit Card (LOAN_TAKEN/CREDIT_CARD), Salary (INCOME), Dining (EXPENSE) and Groceries (EXPENSE). The overview shows Bank balance 0, Credit-card debt 0, Income 0, Expenses 0, and the history says "No transactions recorded yet."

**Order:** every case starts with its own freshly registered user, except **UAT-04, which continues from UAT-01** with USER-1. Run UAT-01 before UAT-04. The other cases can run in any order.

**Reset:** to repeat a case, register a new user with a new suffix (for example `uat-mint-1b@test.local`). Old test users can stay; all data is synthetic.

**Two terms used below:** a *login account* is the email and password you sign in with. A *financial account* is one of the five money records listed above (Bank Account, Credit Card and so on).

**Safety rules for ADMIN-01**

- Only disable or enable **users you registered yourself** (USER-5 in UAT-05).
- **Never disable `system.admin@money.local`.** The API does not stop an administrator disabling their own login account, and nobody could re-enable it from the UI. If this happens, message us; we restore it by re-running the migration job.
- Do not disable the five seeded demo users (`anan.chai`, `boonmee.srisuk`, `narin.wong`, `pimchanok.dee`, `somsak.arun` @money.local).

**Browser:** desktop Chrome or Edge. For UAT-03 and UAT-05 open two tabs; each browser tab keeps its own sign-in, so one tab can be USER-5 while the other is ADMIN-01.

## 3. Running API checks from the browser console

The UI never offers another user's records or financial data to an Administrator, so UAT-03 and UAT-05 send requests straight to the API from the signed-in tab. No extra tools are needed.

1. Sign in as the user the step names, in its own tab.
2. Press **F12** and open the **Console** tab. If Chrome asks, type `allow pasting` and press Enter.
3. Paste the helper below once per tab and press Enter. It reads the token that the app keeps for this tab.
4. Paste each step's one-line command and copy the printed status and body into your results.

```javascript
// Helper: call the API as the user signed in to THIS tab
const api = async (method, path, body) => {
  const t = sessionStorage.getItem("pmels-session-token");
  const r = await fetch(path, { method, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  console.log(r.status, text || "(empty body)");
  return { status: r.status, body: text };
};
```

Useful commands (replace the numbers with real IDs):

```javascript
await api("GET", "/api/auth/me")            // who is this tab signed in as
await api("GET", "/api/accounts")           // own financial accounts with their id
await api("GET", "/api/transactions")       // own transactions with their id
await api("GET", "/api/summaries/balances") // balance of every own financial account
```

To keep a token after logout (UAT-04), run `const oldToken = sessionStorage.getItem("pmels-session-token")` **before** clicking Log out. The app does not reload the page on logout, so the variable survives.

Screenshot the console output together with the address bar so the URL is visible in the evidence.

## 4. Agreed Sprint 1 behaviour and known issues

The behaviours below are deliberate Sprint 1 decisions in our contract. Please do not report them as defects; you may still log them as enhancement suggestions.

| ID | Behaviour | Contract reference |
| --- | --- | --- |
| DEC-1 | Future dates are accepted for opening balances and transactions. | D1 report A.8 (open question), F-03 design |
| DEC-2 | An opening balance can only be set for the Bank Account. Saving it again replaces the earlier value. | BR-11, AC-16 |
| DEC-3 | The card payment form only offers Dining and Groceries lines. | F-05 UI specification |
| DEC-4 | Receive money allocates the whole amount to one income account (Salary). | F-04 design |
| DEC-5 | Repayments go from the Bank Account to the Credit Card only. | BR-10, F-06 |
| DEC-6 | Login with a wrong password, an unknown email or a disabled user all give the same message, "Invalid email or password." | AC-02, F-01 error table |
| DEC-7 | Reloading the page keeps you signed in in that tab. Closing the tab or clicking Log out ends it. | F-01, Lab 5 change (PR #40) |
| DEC-8 | Money is shown without thousands separators, for example `39000`. | F-06 UI |

**Known issue disclosed before testing**

| ID | Behaviour | Affected case | What to do |
| --- | --- | --- | --- |
| D-01 | After you save an opening balance, the **Bank balance** card and the **Current balance** column do not update until another transaction is recorded. The saved value itself is correct. | UAT-01 step 3 | Record what you actually see. It is a real defect against AC-12/AC-34; report it as a finding so it goes through our triage and fix process. |

## 5. UAT cases

Five cases cover the four required categories: normal journey (UAT-01), business rule and boundary (UAT-02), ownership and Administrator denial (UAT-03), state, history and persistence (UAT-04, UAT-05). Money values are in THB with no decimals unless shown.

| ID | Category | Requirements and AC | Users |
| --- | --- | --- | --- |
| UAT-01 | Normal domain journey | FR-07 to FR-10, FR-14 to FR-16; BR-02, BR-03; AC-12, AC-15, AC-17 to AC-20, AC-23, AC-24, AC-27 to AC-34; F07-AC-01, F07-AC-05 | USER-1 |
| UAT-02 | Business rule and boundary | BR-01, BR-09; AC-25, AC-26 | USER-2 |
| UAT-03 | Forbidden ownership and role | BR-04, BR-05; AC-09, AC-11, AC-22, AC-36; F-01 role matrix | USER-3A, USER-3B, ADMIN-01 |
| UAT-04 | State, history and persistence | AC-05, AC-13, AC-14, AC-35; NFR-03, NFR-04 | USER-1 (after UAT-01) |
| UAT-05 | State transition by Administrator | AC-02, AC-06, AC-07; BR-06 | USER-5, ADMIN-01 |

### UAT-01 — Complete money journey with explicit balances

**Purpose:** a new user records an opening balance, a salary, a split card purchase and a partial card repayment; every balance and total matches the calculation below. **Role:** USER. **Preconditions:** none; you register USER-1 in step 1. **Inputs:** synthetic amounts below.

Expected money movement, calculated with balance = opening balance + money received − money paid out:

| After step | Action | Bank balance | Credit-card debt | Income | Expenses |
| --- | --- | --- | --- | --- | --- |
| 3 | Opening balance 10,000 | 10000 | 0 | 0 (opening balance is not income) | 0 |
| 4 | Salary received 30,000 | 40000 | 0 | 30000 | 0 |
| 5 | Card purchase 1,500 = Dining 600 + Groceries 900 | 40000 | 1500 | 30000 | 1500 |
| 6 | Repay 1,000 from Bank Account to Credit Card | 39000 | 500 | 30000 | 1500 (repayment is not expense) |

| # | Action | Expected result |
| --- | --- | --- |
| 1 | On the login page click **Create a new account**. Name `UAT One`, email USER-1, your synthetic password. Click **Create account**. | Green message "Account created successfully. Please sign in." and the form returns to Sign in. |
| 2 | Sign in as USER-1. | Top bar shows `UAT One` and the role `USER`. Overview cards all 0. "Your accounts" lists Bank Account, Credit Card, Salary, Dining, Groceries. History says "No transactions recorded yet." |
| 3 | In **Opening balance for Bank Account** enter amount `10000`, date `2026-11-01`, click **Save balance**. | Accounts table: Bank Account opening balance 10000, as-of date 2026-11-01, **Current balance 10000**. Overview: **Bank balance 10000**, Income 0. |
| 4 | In **Receive money**: Amount `30000`, Date `2026-11-02`, Receiving account `Bank Account`, Income category `Salary`. Click **Record received money**. | "Money received successfully." Bank balance 40000, Income 30000, Expenses 0. |
| 5 | In **Record card payment**: Credit card `Credit Card`, Payment total amount `1500`, Payment date `2026-11-03`, Dining allocation `600`, Groceries allocation `900`. Click **Record card purchase**. | "Payment recorded successfully." Credit-card debt 1500, Expenses 1500, Bank balance still 40000. |
| 6 | In **Repay credit card**: Repayment amount `1000`, Repayment date `2026-11-04`, Bank source account `Bank Account`, Credit-card destination `Credit Card`. Click **Record repayment**. | "Repayment recorded successfully." Bank balance **39000**, Credit-card debt **500**, Income **30000**, Expenses **1500**. |
| 7 | Read the accounts table and the transaction history. | Current balance: Bank Account 39000, Credit Card -500. History has exactly 3 rows, newest first: 2026-11-04 Payment/charge 1000 (repayment); 2026-11-03 Payment/charge 1500 with Dining 600 and Groceries 900; 2026-11-02 Received money 30000 to Salary. |

Do not log out; continue with UAT-04 using this user.

### UAT-02 — Allocation lines must equal the total

**Purpose:** a card purchase whose lines do not add up to the total is rejected by the server and nothing is stored; a correct purchase is still accepted. **Role:** USER. **Preconditions:** USER-2 registered and signed in, all balances 0. **Inputs:** below.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Record card payment: total `1500`, date `2026-11-03`, Dining `600`, Groceries `800` (lines = 1400). Click **Record card purchase**. | Red alert "Allocation total must equal the transaction total." Credit-card debt 0, Expenses 0, history "No transactions recorded yet." |
| 2 | Boundary: total `1500`, Dining `600`, Groceries `899.99` (lines = 1499.99). Submit. | Same red alert. Debt 0, Expenses 0, history still empty. |
| 3 | Console helper, then `await api("GET", "/api/transactions")`. | `200 []` — no transaction stored by steps 1 and 2. |
| 4 | Reload the page. | Still signed in; debt 0, Expenses 0, history empty. |
| 5 | Control: total `1500`, Dining `600`, Groceries `900`. Submit. | "Payment recorded successfully." Credit-card debt 1500, Expenses 1500, exactly 1 history row. |

### UAT-03 — Another user's records and Administrator access are refused

**Purpose:** a user cannot read or use another user's financial accounts or transactions, and an Administrator cannot read any financial data. Refusals must return no private data and change nothing. **Roles:** USER (3A and 3B) and ADMINISTRATOR. **Preconditions:** two tabs open at the application URL. **Inputs:** IDs you read in steps 2 and 4.

| # | Tab and user | Action | Expected result |
| --- | --- | --- | --- |
| 1 | Tab 1, USER-3B | Register and sign in. Record card payment total `1500`, date `2026-11-03`, Dining `600`, Groceries `900`. | Credit-card debt 1500, 1 history row. |
| 2 | Tab 1, USER-3B | Console helper, then `await api("GET", "/api/accounts")` and `await api("GET", "/api/transactions")`. Write down B's Bank Account id (**B_BANK**), Credit Card id (**B_CARD**) and the transaction id (**B_TX**). | 200 with 5 accounts and 1 transaction. |
| 3 | Tab 2, USER-3A | Register and sign in. Console helper, then `await api("GET", "/api/accounts")`; write down A's Bank Account id (**A_BANK**) and Salary id (**A_SALARY**). | 200 with A's own 5 accounts only; none of B's ids appear. |
| 4 | Tab 2, USER-3A | `await api("GET", "/api/accounts/B_BANK")` | `403 {"error":"Account access is not allowed."}` — no name, balance or other field of B's account. |
| 5 | Tab 2, USER-3A | `await api("GET", "/api/transactions/B_TX")` | `403 {"error":"Transaction access is not allowed."}` — no amounts or lines. |
| 6 | Tab 2, USER-3A | `await api("POST", "/api/transactions/repayment", { totalAmount: "100", date: "2026-11-05", sourceAccountId: A_BANK, receivingAccountId: B_CARD })` | `403 {"error":"Credit-card account access is not allowed."}` |
| 7 | Tab 2, USER-3A | `await api("POST", "/api/transactions/receive", { totalAmount: "100", date: "2026-11-05", receivingAccountId: B_BANK, allocations: [{ accountId: A_SALARY, allocationType: "INCOME", amount: "100" }] })` | `403 {"error":"Receiving account access is not allowed."}` |
| 8 | Tab 2, USER-3A | Reload. | A's overview all 0, history empty: nothing was recorded for A. |
| 9 | Tab 1, USER-3B | Reload, then `await api("GET", "/api/transactions")`. | Debt still 1500, Expenses 1500, still exactly 1 transaction: B's data unchanged. |
| 10 | Tab 2 | Log out. Sign in as ADMIN-01. | Administrator view with the user table (Name, Email, Role, Status). No overview cards, accounts or history are shown. |
| 11 | Tab 2, ADMIN-01 | `await api("GET", "/api/accounts")`, then `/api/transactions`, `/api/summaries`, `/api/summaries/balances`, and `/api/transactions/B_TX` (all with `"GET"`). | Each returns `403 {"error":"User access is required."}` and no financial data. |
| 12 | Tab 2, ADMIN-01 | Control: `await api("GET", "/api/admin/users")`. | 200 with users (id, name, email, role, enabled). No `passwordHash` field anywhere in the body. |

### UAT-04 — Saved data survives reload, logout and sign-in

**Purpose:** the UAT-01 results are stored on the server, not only in the page, and logout really ends the session. **Role:** USER. **Preconditions:** UAT-01 completed with USER-1, still signed in. **Inputs:** none.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Reload the page (F5). | Still signed in as UAT One. Bank balance 39000, Credit-card debt 500, Income 30000, Expenses 1500. History 3 rows as in UAT-01 step 7. |
| 2 | In the console run `const oldToken = sessionStorage.getItem("pmels-session-token")`. | No error; `oldToken` holds a long text value. |
| 3 | Click **Log out**. | Login page is shown. |
| 4 | Console: `await fetch("/api/accounts", { headers: { Authorization: "Bearer " + oldToken } }).then(async r => console.log(r.status, await r.text()))` | `401 {"error":"Authentication is required."}` — the old token no longer works and returns no data. |
| 5 | Sign in again as USER-1. | Same values as step 1. Accounts table: Bank Account opening balance 10000, as-of date 2026-11-01. History 3 rows with their allocation lines (Dining 600, Groceries 900, Salary 30000). |

### UAT-05 — Disabling a user ends their access until re-enabled

**Purpose:** the Administrator's only Sprint 1 operation works: a disabled user loses their open session and cannot sign in; after enabling, their saved data is intact. A normal user cannot use Administrator operations. **Roles:** USER and ADMINISTRATOR. **Preconditions:** two tabs. **Inputs:** below.

| # | Tab and user | Action | Expected result |
| --- | --- | --- | --- |
| 1 | Tab 1, USER-5 | Register and sign in. Receive money `5000`, date `2026-11-02`, Bank Account, Salary. Paste the console helper. | Bank balance 5000, Income 5000, 1 history row. |
| 2 | Tab 1, USER-5 | `await api("GET", "/api/admin/users")` | `403 {"error":"Administrator access is required."}` |
| 3 | Tab 2, ADMIN-01 | Sign in. Find USER-5 in the table. | Status `Enabled`, button `Disable`. |
| 4 | Tab 2, ADMIN-01 | Click **Disable** on the USER-5 row only. | Status changes to `Disabled`, button changes to `Enable`. |
| 5 | Tab 1, USER-5 | Without reloading, `await api("GET", "/api/accounts")`. | `401 {"error":"Authentication is required."}` — the open session was ended. |
| 6 | Tab 1 | Reload. | Login page is shown. |
| 7 | Tab 1 | Sign in as USER-5 with the **correct** password. | Red alert "Invalid email or password."; stays on the login page. |
| 8 | Tab 1 | Sign in as USER-5 with a **wrong** password, then with the unknown email `nobody-<yourname>@test.local`. | Both show exactly the same alert, "Invalid email or password." |
| 9 | Tab 2, ADMIN-01 | Click **Enable** on the USER-5 row. | Status `Enabled`. |
| 10 | Tab 1 | Sign in as USER-5 with the correct password. | Workspace opens. Bank balance 5000, Income 5000, 1 history row: data unchanged by disabling. |

## 6. Recording results and reporting findings

Record one result row per case in the shared findings sheet, and one finding row per failure, on the same day you test. We turn each finding into a GitHub Issue labelled `uat` in our repository and tell you its number.

**Result row per case:** case ID · tester name and team · date and time (UTC+7) · tested commit/revision · inputs used · actual result in your own words · PASS / FAIL / BLOCKED · evidence IDs · finding ID if FAIL. Write what you saw, not a copy of the expected result. BLOCKED needs a reason and is not a pass.

**Finding row:** finding ID (UF-01, UF-02 …) · reporter · tested version · case and step · preconditions and data (user label, IDs) · steps to reproduce · expected · actual · proposed severity · evidence IDs. We reply with our triage (accepted defect, duplicate, not-defect or enhancement), the reason and the Issue number.

**Severity scale (agreed before testing)**

| Severity | Meaning for this product | Blocks Sprint 1 acceptance? |
| --- | --- | --- |
| Critical | Wrong money movement or balance; any financial data shown to another user or the Administrator; a refused operation that still changes data; sign-in bypass. | Yes — must be fixed and re-tested by you |
| Major | A Sprint 1 journey cannot be completed and there is no workaround. | Yes — must be fixed and re-tested by you |
| Minor | Wrong or stale display, unclear message, layout problem; a workaround exists and stored data is correct. | No, if fixed or accepted by you as a known limitation |
| Enhancement | Behaviour outside the Sprint 1 contract, including the items in section 4. | No |

**Evidence:** give every screenshot or console capture an ID, and name the file `EV-<case>-<step>_<short commit>_<HHMM>.png`, for example `EV-UAT03-04_abc1234_1415.png`. Keep the address bar and the relevant values readable. For each refused operation, capture both the refusal and the follow-up check that nothing changed (for example UAT-03 steps 8 and 9).

**Re-test after a fix:** we will send you the corrected commit and revision, the finding IDs fixed, and the cases to re-run. Please re-run those cases fully on the new version and record new result rows; do not edit the original rows.

## 7. Sprint 1 acceptance decision (completed by the UAT Team)

Only the UAT Team fills in this record, after the final re-test. The decision applies only to the release and Sprint 1 scope named here. It cannot be Accepted while a critical or major finding is open or any case is BLOCKED.

| Field | Entry |
| --- | --- |
| UAT Team | Phacharawat Eakgawatphokhin · ID 67070503426 · GitHub: KanPhacharawat <br><br>Chaiyaphoom Chenchirotphiphat · ID 67070503410 · GitHub: maneejames<br><br>Theme 6, Course Project Management System. A supervisor sets milestones for the teams they supervise, teams submit work, and the supervisor records feedback. |
| Release accepted or rejected | `v1.0.0-uat` or the corrected tag; commit `d5cbb13`; Cloud Run revision `pmels-00008-85b` (update if a fix release is deployed) |
| Cases run on this release | UAT-01 to UAT-05: PASS / FAIL / BLOCKED for each |
| Findings re-tested | Finding IDs and the version each was re-tested on |
| Decision | Accepted / Accepted with documented minor limitations / Not Accepted |
| Accepted minor limitations | Finding IDs and one-line description, or "none" |

**Contact:** we will message you in the agreed team chat before any deployment. Please message us immediately if the URL is down or an account does not work, so we can record it and, if needed, inform the instructor.

