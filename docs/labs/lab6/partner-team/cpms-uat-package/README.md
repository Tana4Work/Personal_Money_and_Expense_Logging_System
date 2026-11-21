# CPMS Sprint 1 User Acceptance Test (UAT) Plan

**Course**: CPE334 Software Engineering  
**Project**: Course Project Management System (CPMS) — Theme 6  
**Baseline Release**: `v0.1.0` (Commit baseline of Sprint 1)  
**Assessed Scope**: Sprint 1 Delivered Scope (Features F-00 through F-05)  
**Authors**: James (`maneejames`), Kan (`KanPhacharawat`)  
**Target Audience**: Independent UAT Partner Team  
**Partner Handoff Package**: Detailed deployment details, account directory, and 3-session schedule are provided in [**`docs/uat/handoff.md`**](handoff.md).  

---

## 1. System Overview & Test Environment

CPMS provides a centralized platform for academic project milestones, student submissions, and supervisor feedback with role-based access control and strict per-team isolation.

### 1.1 Deployed Environment
* **Live Application URL**: `https://cpms-wpsgfzameq-as.a.run.app`
* **Health Endpoint**: `https://cpms-wpsgfzameq-as.a.run.app/api/health`
* **Readiness Endpoint**: `https://cpms-wpsgfzameq-as.a.run.app/api/ready`
* **Target Revision**: Sprint 1 Cloud Run deployment

### 1.2 In-Scope Features (Sprint 1)
* **F-00**: Project setup, seeded synthetic accounts and teams.
* **F-01**: Authentication (login, logout, session lifecycle, current user).
* **F-02**: Authorization (role check, tenant/team ownership checks, visible-team listing).
* **F-03**: Milestone creation by assigned supervisors; team milestone listing.
* **F-04**: Team submission (title, description, link) and editing before deadline.
* **F-05**: Written supervisor feedback; submission lock upon feedback.

### 1.3 Out-of-Scope (Sprint 2 / 3 — DO NOT ACCEPT OR TEST AS DEFECTS)
* Revision requests, resubmissions, and version history (Sprint 2, F-06).
* Milestone editing and closing (Sprint 2, F-07).
* Grading (Sprint 2, F-08).
* Progress boards and cross-team summary reports (Sprint 3, F-09, F-10).
* File uploads (CPMS submissions accept external HTTP/HTTPS links only).

---

## 2. Test Accounts & Role Directory

> [!IMPORTANT]
> **Zero Secrets Policy**: Passwords are never committed to the repository or printed in report PDFs. Test credentials are exchanged privately through the agreed course communication channel. All accounts share the same course standard password provided privately.

| Account Label | Email | Role | Assigned Team Scope | Purpose in UAT |
|---|---|---|---|---|
| **Supervisor One** | `sup1@cpms.test` | Supervisor | Team Alpha, Team Beta | Primary supervisor for normal journey, milestone creation, and feedback |
| **Supervisor Two** | `sup2@cpms.test` | Supervisor | Team Gamma only | Verification of unassigned supervisor access denial |
| **Student One** | `s1@cpms.test` | Student | Team Alpha | Primary student submitter |
| **Student Two** | `s2@cpms.test` | Student | Team Alpha | Teammate for collaboration, edit verification, and state persistence |
| **Student Three** | `s3@cpms.test` | Student | Team Beta | Verification of student access denial across teams |
| **Student Five** | `s5@cpms.test` | Student | Team Gamma | Secondary tenant student |

---

## 3. Test Data Rules & Reset Protocol

1. **Naming Rule**: Any created test entity (milestone, submission) MUST begin with the prefix `UAT-<team>-<caseId>` (e.g., `UAT-Alpha-01`, `UAT-Beta-02`).
2. **Synthetic Data**: Use only synthetic titles, URLs, and descriptions. No real student IDs, passwords, or personal data.
3. **Data Reset / Idempotency**:
   * Seeded accounts and teams are permanent fixtures.
   * Tests operate on newly created milestones with unique timestamps or distinct IDs to prevent collisions.

---

## 4. Test Case Summary Matrix

| Case ID | Case Title | Category | Requirements / AC | Target Role(s) | Execution Order |
|---|---|---|---|---|---|
| [**UAT-01**](UAT-01-normal-journey.md) | End-to-End Milestone Lifecycle | Normal journey | FR-01, FR-05, FR-06, FR-07, FR-09, FR-10; BR-03, BR-04, BR-05, BR-07, BR-08; AC-01, AC-06, AC-10, AC-11, AC-17, AC-21 | Supervisor One, Student One | Ordered (Sequential flow) |
| [**UAT-02**](UAT-02-business-rule-boundary-validation.md) | Boundary Validation & Deadline Enforcement | Business rule / boundary | FR-05, FR-07, BR-04, BR-06, BR-09; AC-07, AC-13, AC-14 | Supervisor One, Student One | Independent |
| [**UAT-03**](UAT-03-business-rule-submission-lifecycle.md) | Single Submission & Feedback Immutability Lock | Business rule / boundary | FR-08, FR-09, FR-10, BR-05, BR-07, BR-08; AC-12, AC-16, AC-17, AC-18, AC-20 | Student One, Student Two, Supervisor One | Independent (or follows UAT-01) |
| [**UAT-04**](UAT-04-forbidden-role-ownership.md) | Tenant Isolation & Unauthorized Role Access Denial | Forbidden role / ownership | FR-04, FR-05, FR-07, FR-10, BR-01, BR-02, BR-03; AC-08, AC-09, AC-10, AC-15, AC-19, NFR-03 | Student Three (Beta), Supervisor Two (Gamma) | Independent |
| [**UAT-05**](UAT-05-state-persistence-multitenancy.md) | Multi-User Real-Time Persistence & Reload Durability | State / history / persistence | FR-06, FR-09, NFR-05; AC-11, AC-17, AC-21 | Student One, Student Two, Supervisor One | Independent |
| [**UAT-06**](UAT-06-auth-session-lifecycle.md) | Authentication Lifecycle & Private Route Guard | Auth | FR-01, FR-02, FR-03, NFR-01, NFR-02, NFR-04; AC-01, AC-02, AC-03, AC-04, AC-22 | Unauthenticated Visitor, Student One | Independent |

---

## 5. Execution & Evidence Recording Guidelines for UAT Partner Team

When executing these cases:
* **Record Real Observations**: Fill in the **Actual Result** field with what you actually observe on the screen. Do not copy the expected result.
* **Determine Status**:
  * **PASS**: Actual behavior matches expected results completely.
  * **FAIL**: Behavior violates the specified AC or Business Rule. Log a defect using the [UAT defect template](../../.github/ISSUE_TEMPLATE/uat-defect.md).
  * **BLOCKED**: Unable to reach test steps due to environmental or dependency failure.
* **Evidence IDs**: Name screenshots using the format `E-B<number>-<caseId>-<step>` (e.g., `E-B01-UAT01-submitted.png`) and store them in `docs/evidence/lab-06/`.
