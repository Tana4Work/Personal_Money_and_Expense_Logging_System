# UAT-06: Authentication Lifecycle and Private Route Protection (Auth)

## 1. Case Metadata
* **Case ID**: `UAT-06`
* **Category**: Auth
* **Requirements Traceability**: `FR-01`, `FR-02`, `FR-03`, `NFR-01`, `NFR-02`, `NFR-04`
* **Acceptance Criteria**: `AC-01`, `AC-02`, `AC-03`, `AC-04`, `AC-22`
* **Execution Order**: **Independent** (Can be executed at any time)

---

## 2. Purpose
Verify the end-to-end security and authentication lifecycle of CPMS:
1. **Private Route Protection (`AC-03`, `AC-22`)**: Any attempt by an unauthenticated visitor to access protected pages (`/`, `/teams/...`, `/milestones/...`) immediately redirects to `/login`.
2. **Credential Validation & User Enumeration Prevention (`AC-02`, `NFR-04`)**:
   * Submitting empty inputs prompts required-field warnings.
   * Invalid passwords and unknown email addresses yield an identical, secure error message (e.g., *"Invalid email or password"*), preventing attacker user enumeration.
3. **Session Establishment (`AC-01`, `FR-03`)**: Valid credentials log the user in, redirect to the originally requested page, and display authenticated user identity (Name, Email, Role badge).
4. **Session Termination & History Protection (`AC-04`, `FR-02`)**: Logging out destroys the server session; subsequent requests or clicking browser "Back" forces a redirect to `/login` without exposing private cached data.

---

## 3. Roles & Test Accounts
* **Unauthenticated User**: External visitor with no active session cookie.
* **Authorized User**: Student One (`s1@cpms.test`) — Student role.

---

## 4. Preconditions
1. Test begins in a new **Private / Incognito** browser window to ensure no leftover cookies or cached session state.
2. Valid password for seed accounts is known to the tester.

---

## 5. Synthetic Inputs
* **Unknown Account**: Email `nobody@cpms.test`, Password `password123`
* **Wrong Password**: Email `s1@cpms.test`, Password `WrongPassword!999`
* **Valid Account**: Email `s1@cpms.test`, Password `<provided-test-password>`

---

## 6. Numbered User Actions

### Test 6.1: Direct Route Guard & Unauthenticated Redirection
1. Open a fresh Private / Incognito browser window.
2. Enter the root URL directly in the browser address bar:
   `https://<app-url>/`
3. Observe the URL and rendered page.
4. Attempt to access a deep private route:
   `https://<app-url>/teams/00000000-0000-4000-8000-0000000000a1`
5. Observe the URL and rendered page.

### Test 6.2: Form Validation & Failed Login Error Handling
6. On the `/login` page, click the **"Log in"** button with both fields empty.
7. Observe field validation indicators.
8. Enter Email: `nobody@cpms.test` and Password: `password123`. Click **"Log in"**.
9. Note the exact error message displayed in the alert banner.
10. Enter Email: `s1@cpms.test` and Password: `WrongPassword!999`. Click **"Log in"**.
11. Compare the error message with Step 9.

### Test 6.3: Successful Login & Identity Verification
12. Enter valid credentials:
    * Email: `s1@cpms.test`
    * Password: `<provided-test-password>`
13. Click **"Log in"**.
14. Observe redirection to the destination page.
15. Inspect the top application shell / header:
    * Verify user name shows **"Student One"**.
    * Verify role badge indicates **`STUDENT`**.
    * Verify team card displays **"Team Alpha"**.

### Test 6.4: Logout & Session Invalidation
16. Click the **"Log out"** button in the header.
17. Verify redirection to `/login`.
18. Click the browser's **"Back"** button.
19. Attempt to refresh or click any link on the page.
20. Observe whether any private student data is accessible.

---

## 7. Specific Expected Results
* **Step 2–5**: Unauthenticated requests to `/` or `/teams/...` are intercepted and redirected to `/login`. The previous URL is preserved for post-login redirect.
* **Step 6–7**: Client-side validation blocks submission; prompts *"Enter your email"* and *"Enter your password"*.
* **Step 8–11**: Both invalid attempts fail with identical error messages (e.g., *"Invalid email or password"* / *"INVALID_CREDENTIALS"*). The application does not disclose whether `nobody@cpms.test` exists.
* **Step 14–15**: User is authenticated; header displays identity (Student One, STUDENT, `s1@cpms.test`).
* **Step 16–17**: Logout request completes; session is terminated on server; page redirects to `/login`.
* **Step 18–20**: Navigating back or attempting actions immediately redirects back to `/login`; the invalidated session cannot access protected routes.

---

## 8. Evidence to Capture
* **Screenshot E-B06a**: Unauthenticated URL attempt redirecting to `/login` with empty form.
* **Screenshot E-B06b**: Generic "Invalid credentials" error banner for wrong password.
* **Screenshot E-B06c**: Authenticated Home dashboard displaying Student One profile and Team Alpha.
* **Screenshot E-B06d**: Post-logout redirect verifying session termination.
