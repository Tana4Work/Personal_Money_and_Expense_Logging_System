# UAT-01: End-to-End Milestone Lifecycle (Normal Domain Journey)

## 1. Case Metadata
* **Case ID**: `UAT-01`
* **Category**: Normal journey
* **Requirements Traceability**: `FR-01`, `FR-03`, `FR-04`, `FR-05`, `FR-06`, `FR-07`, `FR-09`, `FR-10`
* **Business Rules**: `BR-03`, `BR-04`, `BR-05`, `BR-07`, `BR-08`
* **Acceptance Criteria**: `AC-01`, `AC-06`, `AC-10`, `AC-11`, `AC-17`, `AC-21`
* **Execution Order**: **Ordered** (Sequenced lifecycle: Step 1 through Step 16 must run in chronological order)

---

## 2. Purpose
Verify the fundamental happy-path lifecycle of CPMS:
1. Supervisor logs in and creates a milestone with a future due date for an assigned team.
2. Student of that team logs in, views the newly created milestone, and submits project work with title, description, and link.
3. Supervisor reviews the submission and records written feedback.
4. Student views the saved feedback and confirms the submission is locked against further edits.

---

## 3. Roles & Test Accounts
* **Supervisor**: Supervisor One (`sup1@cpms.test`) — Assigned to Team Alpha.
* **Student**: Student One (`s1@cpms.test`) — Member of Team Alpha.

---

## 4. Preconditions
1. Application is accessible at `https://cpms-wpsgfzameq-as.a.run.app` (or verified local deployment).
2. Seed accounts are loaded.
3. Tester has access to test credentials provided out-of-band.

---

## 5. Synthetic Inputs
* **Milestone Title**: `UAT-Alpha-01 Sprint 1 Deliverable`
* **Milestone Due Date**: Date and time set 7 days into the future (e.g., `YYYY-MM-DDTHH:mm`).
* **Milestone Description**: `Full deliverable milestone for testing the primary UAT-01 workflow.`
* **Submission Title**: `UAT-Alpha-01 Deliverable Report`
* **Deliverable Link**: `https://github.com/example/uat-alpha-demo`
* **Submission Description**: `Initial Sprint 1 completed work for evaluation.`
* **Supervisor Feedback**: `Well structured deliverable. All core acceptance criteria are satisfied.`

---

## 6. Numbered User Actions

### Phase 1: Supervisor creates Milestone
1. Open browser and navigate to `/login`.
2. Enter Email `sup1@cpms.test` and the provided password. Click **"Log in"**.
3. Verify landing on the Home page (`/`) displaying assigned teams. Click on **"Team Alpha"**.
4. On the Team Alpha page (`/teams/...`), locate the **"New milestone"** form below the milestones table.
5. Fill in the fields:
   * **Title**: `UAT-Alpha-01 Sprint 1 Deliverable`
   * **Due date**: Select or enter a date/time 7 days in the future.
   * **Description**: `Full deliverable milestone for testing the primary UAT-01 workflow.`
6. Click the **"Create milestone"** button.
7. Verify the milestone appears in the table with status badge **`OPEN`**.
8. Click on the milestone title link to open the milestone detail page (`/milestones/<id>`). Copy or record this URL.
9. Click the **"Log out"** button in the top navigation bar.

### Phase 2: Student submits Work
10. At `/login`, enter Email `s1@cpms.test` and the provided password. Click **"Log in"**.
11. Navigate to the milestone URL recorded in Step 8 (or navigate via Home $\rightarrow$ Team Alpha $\rightarrow$ click milestone).
12. Verify the page displays the **"Submit work"** card. Fill in the submission fields:
    * **Title**: `UAT-Alpha-01 Deliverable Report`
    * **Deliverable link**: `https://github.com/example/uat-alpha-demo`
    * **Description**: `Initial Sprint 1 completed work for evaluation.`
13. Click the **"Submit"** button.
14. Verify the page updates:
    * Status badge changes to **`SUBMITTED`**.
    * Submission details (Title, Link, Description, Submitted by Student One) are rendered.
15. Click **"Log out"**.

### Phase 3: Supervisor provides Feedback & Lock Verification
16. Log in as Supervisor One (`sup1@cpms.test`).
17. Open the milestone URL from Step 8.
18. Verify the student's submission is visible. Locate the **"Feedback"** form below the submission.
19. In the **Feedback** textarea, enter: `Well structured deliverable. All core acceptance criteria are satisfied.`
20. Click **"Save feedback"** button.
21. Verify status badge changes to **`FEEDBACK_GIVEN`** and the feedback card appears with supervisor's name and feedback text.
22. Click **"Log out"**.
23. Log in as Student One (`s1@cpms.test`) and navigate back to the milestone URL.
24. Observe the submission card and status badges.

---

## 7. Specific Expected Results
* **Step 6–7**: Milestone is created successfully and listed in the team's milestone list with status badge **`OPEN`**.
* **Step 13–14**: Submission is successfully recorded. The status updates from `OPEN` to `SUBMITTED`. The link is clickable and formatted as a valid external link.
* **Step 20–21**: Supervisor feedback is successfully attached to the submission. Status updates to `FEEDBACK_GIVEN`.
* **Step 24**: Student sees the feedback card. A badge/notice displaying **"Locked after feedback"** is present. The **"Edit submission"** button is **NOT visible** (confirming the submission is locked per BR-07).

---

## 8. Evidence to Capture
* **Screenshot E-B01a**: Team Alpha page showing created milestone with `OPEN` badge.
* **Screenshot E-B01b**: Milestone page showing saved submission with `SUBMITTED` badge.
* **Screenshot E-B01c**: Milestone page as Student showing `FEEDBACK_GIVEN`, supervisor's feedback text, and "Locked after feedback" indicator.
