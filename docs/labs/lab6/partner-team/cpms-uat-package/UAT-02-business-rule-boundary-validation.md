# UAT-02: Boundary Validation and Deadline Enforcement (Business Rule / Boundary)

## 1. Case Metadata
* **Case ID**: `UAT-02`
* **Category**: Business rule / boundary
* **Requirements Traceability**: `FR-05`, `FR-07`
* **Business Rules**: `BR-04`, `BR-06`, `BR-09`
* **Acceptance Criteria**: `AC-07`, `AC-13`, `AC-14`
* **Execution Order**: **Independent** (Can be executed at any time)

---

## 2. Purpose
Verify system resilience and business rule enforcement on input boundaries and deadlines:
1. Milestone creation rejects titles shorter than 3 characters, longer than 120 characters, or due dates in the past.
2. Submission creation rejects invalid URL formats (non-HTTP/HTTPS schemes, malformed links) and invalid title lengths.
3. Submissions cannot be made on milestones whose deadline has passed (`BR-06`).

---

## 3. Roles & Test Accounts
* **Supervisor**: Supervisor One (`sup1@cpms.test`) — Assigned to Team Alpha.
* **Student**: Student One (`s1@cpms.test`) — Member of Team Alpha.

---

## 4. Preconditions
1. User accounts `sup1@cpms.test` and `s1@cpms.test` are operational.
2. Application is deployed and running.

---

## 5. Synthetic Inputs
* **Invalid Milestone Title (Short)**: `AB` (2 characters; minimum is 3)
* **Invalid Milestone Due Date (Past)**: Yesterday's date/time (e.g., `2026-01-01T12:00`)
* **Valid Milestone Title (Boundary)**: `UAT-02 Valid 3-char Min` (Valid)
* **Invalid Submission Title**: `X` (1 character; minimum is 3)
* **Invalid Submission Schemes**:
  * `ftp://files.example.com/project.zip` (FTP protocol disallowed)
  * `just-a-plain-string` (Not a URL)
  * `javascript:alert(1)` (Security boundary)
* **Valid Submission Link**: `https://github.com/example/boundary-proof`

---

## 6. Numbered User Actions

### Test 2.1: Milestone Boundary & Past Date Validation
1. Log in as Supervisor One (`sup1@cpms.test`).
2. Navigate to Team Alpha (`/teams/<alpha-id>`).
3. Scroll to the **"New milestone"** form.
4. Enter Title: `AB` (2 characters), Due date: Select a date in the future. Click **"Create milestone"**.
5. Observe the UI response.
6. Enter Title: `Valid Title for Past Check`, Due date: Manually enter a date in the past (e.g., `2026-01-01T10:00`). Click **"Create milestone"**.
7. Observe the UI response.
8. Verify that neither invalid milestone was added to the milestones table.
9. Enter a valid future milestone:
   * Title: `UAT-Alpha-02 Boundary Sandbox`
   * Due date: 5 days in the future.
   * Click **"Create milestone"**.
10. Verify this milestone appears with status badge **`OPEN`**. Note its URL.
11. Click **"Log out"**.

### Test 2.2: Submission Input Boundary Validation
12. Log in as Student One (`s1@cpms.test`).
13. Navigate to the `UAT-Alpha-02 Boundary Sandbox` milestone page created in Step 10.
14. Under **"Submit work"**, test Title boundary:
    * Title: `No` (2 characters)
    * Deliverable link: `https://github.com/example/valid`
    * Description: `Testing short title`
    * Click **"Submit"**. Observe error.
15. Test non-HTTP URL protocol:
    * Title: `Valid Submission Title`
    * Deliverable link: `ftp://files.example.com/archive.tar.gz`
    * Click **"Submit"**. Observe error.
16. Test plain text instead of URL:
    * Deliverable link: `my-shared-google-drive-folder`
    * Click **"Submit"**. Observe error.
17. Verify that no submission was created (status remains **`OPEN`**).

### Test 2.3: Deadline Passed Rejection
18. Navigate to any milestone whose deadline is in the past (or verify UI behavior on past-due milestone).
19. Observe the submission section.

---

## 7. Specific Expected Results
* **Step 4–5**: Form is blocked; inline validation error appears: *"Title must be between 3 and 120 characters"* (or equivalent validation message).
* **Step 6–7**: Form is blocked; error message indicates: *"Due date must be in the future"*. No milestone is created.
* **Step 14**: Form validation blocks submission; inline error indicates title must be at least 3 characters.
* **Step 15–16**: Form validation blocks submission; inline error indicates link must be a valid `http://` or `https://` URL. The status remains **`OPEN`**.
* **Step 18–19**: When deadline has passed, the submit form is disabled/hidden and displays a clear message (e.g., *"Deadline passed: submissions are closed"* per AC-13).

---

## 8. Evidence to Capture
* **Screenshot E-B02a**: Milestone form rejecting past due date / short title with validation alerts.
* **Screenshot E-B02b**: Submission form rejecting FTP / non-URL deliverable links with field validation errors.
* **Screenshot E-B02c**: Past-due milestone view showing deadline closure notice.
