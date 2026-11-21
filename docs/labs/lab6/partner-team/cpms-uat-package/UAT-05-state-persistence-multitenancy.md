# UAT-05: Multi-User Real-Time Persistence and Reload Durability (State / History / Persistence)

## 1. Case Metadata
* **Case ID**: `UAT-05`
* **Category**: State / history / persistence
* **Requirements Traceability**: `FR-06`, `FR-09`, `NFR-05`
* **Acceptance Criteria**: `AC-11`, `AC-17`, `AC-21`
* **Execution Order**: **Independent** (or can be combined with existing test milestones)

---

## 2. Purpose
Verify data persistence, multi-user consistency, and backend durability:
1. **Durable Storage (`NFR-05`)**: Newly created milestones, submissions, and feedback persist across hard browser refreshes (`Ctrl+F5` / `Cmd+Shift+R`), browser restarts, and server session invalidations.
2. **Multi-User State Synchronization (`AC-11`)**: Work submitted by Student One is immediately stored in PostgreSQL and displayed identically to teammate Student Two and assigned Supervisor One.
3. **Audit Trail & Attribution**: Submissions accurately record and preserve the submitting author's name (`Submitted by Student One`) and timestamp without data degradation.

---

## 3. Roles & Test Accounts
* **Submitter**: Student One (`s1@cpms.test`) — Team Alpha.
* **Teammate**: Student Two (`s2@cpms.test`) — Team Alpha.
* **Reviewer**: Supervisor One (`sup1@cpms.test`) — Team Alpha.

---

## 4. Preconditions
1. Application is operational on Cloud Run with Cloud SQL connection active.
2. An open milestone exists for Team Alpha (e.g., `UAT-Alpha-05 Persistence Milestone`).

---

## 5. Synthetic Inputs
* **Submission Title**: `UAT-Alpha-05 Persistence Verification Document`
* **Deliverable Link**: `https://github.com/example/persistence-artifact`
* **Submission Description**: `Synthetic artifact to verify persistent PostgreSQL storage across reloads and multi-user sessions.`
* **Feedback Text**: `Verified persistent deliverable state.`

---

## 6. Numbered User Actions

### Part 1: Submission and Reload Durability
1. Open Browser Window 1 (or regular browser tab) and log in as Student One (`s1@cpms.test`).
2. Navigate to the open milestone for Team Alpha.
3. In the "Submit work" form, enter:
   * **Title**: `UAT-Alpha-05 Persistence Verification Document`
   * **Deliverable link**: `https://github.com/example/persistence-artifact`
   * **Description**: `Synthetic artifact to verify persistent PostgreSQL storage across reloads and multi-user sessions.`
4. Click **"Submit"**.
5. Verify the submission appears with status **`SUBMITTED`**.
6. Perform a browser **Hard Refresh** (`Ctrl+F5` on Windows/Linux or `Cmd+Shift+R` on Mac).
7. Inspect the reloaded page:
   * Verify all submitted fields (Title, URL, Description) remain fully intact.
   * Verify status badge remains **`SUBMITTED`**.
8. Click **"Log out"**.

### Part 2: Cross-User Multi-Session Consistency
9. Open Browser Window 2 (or an Incognito window) and log in as teammate Student Two (`s2@cpms.test`).
10. Navigate to the Team Alpha milestone URL.
11. Inspect the submission card:
    * Verify the submission is visible with identical title, description, and link.
    * Verify the text displays: *"Submitted by Student One"*.
12. Click **"Log out"**.

### Part 3: Feedback Durability Across Sessions
13. Log in as Supervisor One (`sup1@cpms.test`).
14. Navigate to the milestone URL.
15. Enter feedback: `Verified persistent deliverable state.` Click **"Save feedback"**.
16. Verify status badge updates to **`FEEDBACK_GIVEN`**.
17. Log out and close all browser tabs.
18. Open a fresh browser window and log back in as Student One (`s1@cpms.test`).
19. Re-open the milestone URL.
20. Verify that the submission, the supervisor's feedback, and the **"Locked after feedback"** badge persist completely.

---

## 7. Specific Expected Results
* **Step 6–7**: Hard refresh causes no data loss; state is loaded cleanly from the server.
* **Step 10–11**: Teammate Student Two immediately sees the submission authored by Student One, verifying shared team scope.
* **Step 19–20**: Re-authenticating in a new browser session retains the full state: status is `FEEDBACK_GIVEN`, supervisor's feedback text is displayed, and the locked state is permanently preserved.

---

## 8. Evidence to Capture
* **Screenshot E-B05a**: Student One view showing submission intact after browser hard refresh.
* **Screenshot E-B05b**: Student Two view showing the same submission with author attribution "Submitted by Student One".
* **Screenshot E-B05c**: Milestone view after re-login showing persisted feedback and locked status.
