# UAT-03: Submission Edit Lifecycle and Feedback Immutability Lock (Business Rule / Boundary)

## 1. Case Metadata
* **Case ID**: `UAT-03`
* **Category**: Business rule / boundary
* **Requirements Traceability**: `FR-08`, `FR-09`, `FR-10`
* **Business Rules**: `BR-05`, `BR-07`, `BR-08`
* **Acceptance Criteria**: `AC-12`, `AC-16`, `AC-17`, `AC-18`, `AC-20`
* **Execution Order**: **Independent** (or can be executed directly using an open milestone)

---

## 2. Purpose
Verify the strict lifecycle and immutability rules of submissions and feedback:
1. **Single Submission Rule (`BR-05`)**: A team can have at most one submission per milestone. After initial submission, the "Submit work" form is replaced by an "Edit submission" option.
2. **Teammate Collaboration & Editing (`AC-16`)**: Any registered member of the team (e.g., Student Two) can edit the submission before the deadline and before feedback is recorded.
3. **Feedback Immutability Lock (`BR-07`, `AC-18`)**: As soon as written feedback is recorded by the supervisor, the submission is strictly locked; students cannot edit the title, description, or link.
4. **Single Feedback per Submission (`BR-08`, `AC-20`)**: A supervisor cannot append a second feedback to an already reviewed submission.

---

## 3. Roles & Test Accounts
* **Submitter**: Student One (`s1@cpms.test`) — Team Alpha.
* **Teammate Editor**: Student Two (`s2@cpms.test`) — Team Alpha.
* **Supervisor**: Supervisor One (`sup1@cpms.test`) — Assigned to Team Alpha.

---

## 4. Preconditions
1. An open milestone exists for Team Alpha (e.g., created during UAT-01 or created fresh with future due date).
2. The milestone has not yet received supervisor feedback.

---

## 5. Synthetic Inputs
* **Initial Submission Title**: `UAT-03 Initial Draft by S1`
* **Initial Deliverable Link**: `https://github.com/example/alpha/draft-1`
* **Updated Submission Title**: `UAT-03 Final Team Revision by S2`
* **Updated Deliverable Link**: `https://github.com/example/alpha/final-v1`
* **Updated Description**: `Updated deliverable link and documentation by Student Two.`
* **Supervisor Feedback**: `Submission reviewed and approved for Sprint 1 baseline.`

---

## 6. Numbered User Actions

### Part 1: Initial Submission & Teammate Edit
1. Log in as Student One (`s1@cpms.test`).
2. Navigate to Team Alpha's open milestone.
3. Fill in the "Submit work" form with initial values:
   * Title: `UAT-03 Initial Draft by S1`
   * Deliverable link: `https://github.com/example/alpha/draft-1`
   * Description: `Initial upload`
4. Click **"Submit"**. Verify status is **`SUBMITTED`**.
5. Verify that there is **NO option to submit a second time** (the "Submit work" form is gone; replaced with submission display and an **"Edit submission"** button).
6. Click **"Log out"**.
7. Log in as teammate Student Two (`s2@cpms.test`).
8. Navigate to the same milestone.
9. Verify that Student Two can see Student One's submission.
10. Click the **"Edit submission"** button.
11. Update the fields:
    * Change Title to: `UAT-03 Final Team Revision by S2`
    * Change Deliverable link to: `https://github.com/example/alpha/final-v1`
    * Change Description to: `Updated deliverable link and documentation by Student Two.`
12. Click **"Save changes"**.
13. Verify the displayed submission reflects the new title, new link, and indicates the updated author/time.
14. Click **"Log out"**.

### Part 2: Supervisor Feedback and Lock Verification
15. Log in as Supervisor One (`sup1@cpms.test`).
16. Navigate to the milestone.
17. Verify the edited submission by Student Two is visible.
18. In the **Feedback** form, enter: `Submission reviewed and approved for Sprint 1 baseline.`
19. Click **"Save feedback"**.
20. Verify status badge updates to **`FEEDBACK_GIVEN`** and the feedback card is displayed.
21. Verify that the supervisor's feedback form is now **gone** (no second feedback form is rendered per AC-20).
22. Click **"Log out"**.
23. Log in as Student One (`s1@cpms.test`) and navigate to the milestone.
24. Verify that:
    * The supervisor's feedback card is visible.
    * A notice displaying **"Locked after feedback"** is shown.
    * The **"Edit submission"** button is **completely absent**.

---

## 7. Specific Expected Results
* **Step 5**: Single submission rule enforced: only one submission per milestone.
* **Step 12–13**: Edit succeeds: Teammate Student Two is authorized to edit the submission; the updated values are stored and rendered immediately.
* **Step 20–21**: Feedback is saved; supervisor cannot add a duplicate feedback record.
* **Step 24**: Immutability lock enforced: Once feedback is recorded, the edit interface is revoked for students, preventing any further modifications to Sprint 1 deliverables.

---

## 8. Evidence to Capture
* **Screenshot E-B03a**: Student Two editing Student One's submission with updated title and URL.
* **Screenshot E-B03b**: Supervisor view showing feedback saved with no second feedback form.
* **Screenshot E-B03c**: Student view showing "Locked after feedback" badge and absence of "Edit submission" button.
