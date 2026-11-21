# UAT-04: Tenant Isolation and Forbidden Role Access Denial (Forbidden Role / Ownership)

## 1. Case Metadata
* **Case ID**: `UAT-04`
* **Category**: Forbidden role / ownership
* **Requirements Traceability**: `FR-04`, `FR-05`, `FR-07`, `FR-10`
* **Business Rules**: `BR-01`, `BR-02`, `BR-03`
* **Acceptance Criteria**: `AC-08`, `AC-09`, `AC-10`, `AC-15`, `AC-19`, `NFR-03`
* **Execution Order**: **Independent** (Can be executed at any time)

---

## 2. Purpose
Verify strict tenant isolation and role permission boundaries:
1. **Student Cross-Tenant Isolation (`BR-01`, `AC-10`, `AC-15`)**: A student belonging to Team Beta cannot see, navigate to, or retrieve information regarding Team Alpha (members, milestones, submissions).
2. **Supervisor Assignment Isolation (`BR-02`, `AC-08`, `AC-19`)**: A supervisor assigned exclusively to Team Gamma cannot view or interact with Team Alpha.
3. **Role Enforcement (`BR-03`, `AC-09`)**: Students are strictly prohibited from creating milestones or providing feedback; supervisors are strictly prohibited from creating submissions.

---

## 3. Roles & Test Accounts
* **Out-of-Scope Student**: Student Three (`s3@cpms.test`) — Member of Team Beta.
* **Unassigned Supervisor**: Supervisor Two (`sup2@cpms.test`) — Assigned to Team Gamma only.
* **Target Resources**: Team Alpha (`id: 00000000-0000-4000-8000-0000000000a1`) and Team Alpha's milestones.

---

## 4. Preconditions
1. Team Alpha exists and contains at least one milestone and one submission.
2. Target URLs:
   * Team Alpha Page: `/teams/00000000-0000-4000-8000-0000000000a1`
   * Team Alpha Milestone: Note a valid milestone ID belonging to Team Alpha (`/milestones/<alpha-milestone-id>`).

---

## 5. Synthetic Inputs
* No data inputs required; tests verify denial of unauthorized operations and prevention of data disclosure.

---

## 6. Numbered User Actions

### Test 4.1: Cross-Team Isolation for Students (Team Beta Student $\rightarrow$ Team Alpha)
1. Log in as Student Three (`s3@cpms.test`, Team Beta).
2. Observe the Home dashboard:
   * Verify that the only visible team card is **"Team Beta"**.
   * Verify that neither **"Team Alpha"** nor **"Team Gamma"** appears in the list.
3. Attempt direct URL traversal by entering the Team Alpha URL in the browser address bar:
   `https://<app-url>/teams/00000000-0000-4000-8000-0000000000a1`
4. Observe the page display.
5. Attempt direct URL traversal to Team Alpha's milestone:
   `https://<app-url>/milestones/<alpha-milestone-id>`
6. Observe the page display.
7. Return to the Team Beta page (`/teams/<beta-id>`). Inspect the page to check if any **"New milestone"** creation form or button exists.
8. Click **"Log out"**.

### Test 4.2: Unassigned Supervisor Isolation (Supervisor Two $\rightarrow$ Team Alpha)
9. Log in as Supervisor Two (`sup2@cpms.test`, assigned only to Team Gamma).
10. Observe the Home dashboard:
    * Verify that the only visible team under "Assigned teams" is **"Team Gamma"**.
    * Verify that **"Team Alpha"** and **"Team Beta"** are **NOT** shown.
11. Attempt direct URL traversal to Team Alpha:
    `https://<app-url>/teams/00000000-0000-4000-8000-0000000000a1`
12. Observe the page display.
13. Attempt direct URL traversal to Team Alpha's milestone:
    `https://<app-url>/milestones/<alpha-milestone-id>`
14. Observe the page display.
15. Navigate to Supervisor Two's assigned team (Team Gamma). Open an open milestone for Team Gamma.
16. Verify that Supervisor Two has **NO "Submit work"** form or submit button (supervisors cannot submit work).

---

## 7. Specific Expected Results
* **Step 2**: Home page lists only Team Beta. No other team names or membership details are exposed.
* **Step 4**: Navigation to Team Alpha renders an explicit error state:
  * Error heading: *"Error"* or *"Not found or you do not have access"* (HTTP 404 handled gracefully).
  * No Team Alpha members, supervisor names, or milestones are leaked in the DOM or network response.
* **Step 6**: Navigation to Team Alpha's milestone renders *"Not found or you do not have access"*. No submission link, title, or feedback is revealed.
* **Step 7**: Student view on Team Beta contains NO milestone creation form (role check enforced in UI and API).
* **Step 10**: Supervisor Two sees only Team Gamma.
* **Step 12 & 14**: Unassigned supervisor attempting to access Team Alpha or its milestones is denied with *"Not found or you do not have access"* (zero disclosure).
* **Step 16**: Milestone page for supervisor contains feedback capabilities only; submission forms are restricted to student roles.

---

## 8. Evidence to Capture
* **Screenshot E-B04a**: Student Three's home dashboard showing only Team Beta.
* **Screenshot E-B04b**: Student Three encountering "Not found or you do not have access" when accessing Team Alpha.
* **Screenshot E-B04c**: Supervisor Two encountering "Not found or you do not have access" when attempting to access Team Alpha.
