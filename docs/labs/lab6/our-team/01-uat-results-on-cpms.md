# Lab 6 Part B: Independent UAT results for CPMS (Theme 6)

| Item | Value |
|---|---|
| Product Team | James (`maneejames`), Kan (`KanPhacharawat`) |
| UAT Team (testers of record) | Tana Udompornkul (67070503418), Thanaphon Ratchatakulpong (67070503417) |
| Tested URL | https://cpms-861207197457.asia-southeast1.run.app (the handoff lists `https://cpms-wpsgfzameq-as.a.run.app`; both are Cloud Run URLs for service `cpms`. Confirm with the Product Team.) |
| Tested version | Tag `v0.1.0` (confirmed by the Product Team); deployed commit `a11fdc0` per their handoff (also the head of their `main` branch). Cloud Run revision requested from the Product Team. |
| Execution window | 17 Nov 2026, 13:45–14:11 (UTC+7), one continuous session |
| Readiness at start | `/api/ready` → `{"ok":true,"database":"up"}`; `/api/health` → `{"ok":true}` |
| Method | Manual UI testing in a desktop browser. Server-side checks were sent from the signed-in tab with the browser console (`fetch`), using the same cookie session as the UI. |
| AI assistance | Steps were driven by Claude in the Claude app's browser pane. The testers signed in to every account themselves (Claude never typed a real password; it typed only the synthetic invalid credentials from the case file). Declared in our AI-use section. |
| Credentials | Seeded accounts with the shared password from the private handoff (not recorded here) |

**Testers:** Tana Udompornkul and Thanaphon Ratchatakulpong, both present in the session; both signed in to accounts and ran cases. Per-case tester column: "Tana, Thanaphon".

## Result summary

| Case | Category | Result | Findings / notes |
|---|---|---|---|
| UAT-01 | Normal journey | PASS | — |
| UAT-02 | Business rule / boundary | PASS | — |
| UAT-03 | Business rule / lifecycle | PASS | OBS-03 |
| UAT-04 | Forbidden role / ownership | PASS | — |
| UAT-05 | State / persistence | PASS (with note on step 11 wording) | OBS-02, OBS-03 |
| UAT-06 | Auth | PASS (with observation) | OBS-01 |

No case was BLOCKED. No critical or major failure was found.

### Order of execution

Cases were run in one session, grouped by account to reduce sign-ins: Supervisor One → Student One → Student Two → Supervisor One → Student One → Student Three → Supervisor Two. Inside each case the steps ran in the documented order. For the precondition "an open milestone exists for Team Alpha" in UAT-03 and UAT-05, Supervisor One created `UAT-Alpha-03 Submission Lifecycle` and `UAT-Alpha-05 Persistence Milestone`. Team Gamma had no milestone, so Supervisor Two created `UAT-Gamma-04 Role Check` for UAT-04 step 15.

### Test data created (all synthetic)

| Item | ID | Final state |
|---|---|---|
| Milestone `UAT-Alpha-01 Sprint 1 Deliverable` (due 24 Nov 2026 14:00) | `d6759f19-56b5-4963-bf77-188f3888fa88` | FEEDBACK_GIVEN, locked |
| Milestone `UAT-Alpha-02 Boundary Sandbox` (due 22 Nov 2026 14:00) | `be96376a-4964-446d-a7c3-e67c26163d95` | OPEN, no submission |
| Milestone `UAT-Alpha-03 Submission Lifecycle` (due 24 Nov 2026 14:00) | `97c2f1be-9351-48fa-aa9e-1b6b32ea475a` | FEEDBACK_GIVEN, locked |
| Milestone `UAT-Alpha-05 Persistence Milestone` (due 24 Nov 2026 14:00) | `ca6100ad-4fe9-4f59-a6bb-b3835025baf6` | FEEDBACK_GIVEN, locked |
| Milestone `UAT-Gamma-04 Role Check` (due 24 Nov 2026 14:00) | `ae5012e0-c7ba-4a48-8aa5-c4f33d227093` | OPEN, no submission |

No other records were created: every invalid or forbidden request listed below was rejected, and the follow-up reads confirmed nothing was stored.

---

## UAT-01: End-to-end milestone lifecycle — PASS

| Step | Role | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 1–3 | Supervisor One | Sign in, open home | Home "My teams" shows Alpha and Beta (both assigned teams) | PASS | — |
| 4–7 | Supervisor One | New milestone: title `UAT-Alpha-01 Sprint 1 Deliverable`, due 24 Nov 2026 14:00, description from case | `POST /api/teams/…a1/milestones` → 201; listed with badge OPEN, "Due 24 Nov 2026, 14:00" | PASS | E-B01a |
| 8 | Supervisor One | Open milestone page | `/milestones/d6759f19-…`, OPEN, "No submission yet" | PASS | — |
| 10–12 | Student One | Sign in; opened milestone URL | Returned to the milestone URL after login; "Submit work" card shown | PASS | — |
| 13–14 | Student One | Title `UAT-Alpha-01 Deliverable Report`, link `https://github.com/example/uat-alpha-demo`, description from case | `POST …/submission` → 201; badge SUBMITTED; title, clickable external link and description shown; "Last updated by Student One at 17 Nov 2026, 13:56" | PASS | E-B01b |
| 16–18 | Supervisor One | Open milestone | Submission visible; "Record feedback" form shown; no Edit button for the supervisor | PASS | — |
| 19–21 | Supervisor One | Feedback `Well structured deliverable. All core acceptance criteria are satisfied.` | `POST /api/submissions/692717f3-…/feedback` → 201; badge FEEDBACK_GIVEN; card "Recorded by Supervisor One on 17 Nov 2026, 14:04" with the text; feedback form removed | PASS | E-B01 step 21 |
| 23–24 | Student One | Open milestone | "Locked after feedback" notice, feedback card, FEEDBACK_GIVEN; no "Edit submission" button | PASS | E-B01c |

## UAT-02: Boundary validation and deadline enforcement — PASS

| Step | Role | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 4–5 | Supervisor One | Title `AB`, future due date | Inline error "Title must be between 3 and 120 characters"; no request sent. Server check: `POST …/milestones {title:"AB"}` → 400 `VALIDATION_ERROR` (title) | PASS | E-B02a step 5 |
| 6–7 | Supervisor One | Title `Valid Title for Past Check`, due 2026-01-01 10:00 | Inline error "Due date must be in the future". Server check: past `dueAt` → 400 `VALIDATION_ERROR` (dueAt) | PASS | E-B02a step 7 |
| extra | Supervisor One | Server check: 121-character title | 400 `VALIDATION_ERROR` (title) | PASS | — |
| 8 | Supervisor One | Inspect milestone list | Neither invalid milestone was added | PASS | — |
| 9–10 | Supervisor One | `UAT-Alpha-02 Boundary Sandbox`, due 22 Nov 2026 14:00 | Created, badge OPEN | PASS | E-B02 step 10 |
| 14 | Student One | Title `No`, valid link, description `Testing short title` | Inline error "Title must be between 3 and 120 characters"; no request sent | PASS | E-B02b step 14 |
| 15 | Student One | Link `ftp://files.example.com/archive.tar.gz` | Inline error "Link must be an http or https URL" | PASS | E-B02b step 15 |
| 16 | Student One | Link `my-shared-google-drive-folder` | Inline error "Link must be a valid URL" | PASS | E-B02b step 16 |
| server | Student One | Same three inputs plus `javascript:alert(1)` sent with `POST …/submission` | All four → 400 `VALIDATION_ERROR` (title / link) | PASS | — |
| 17 | Student One | `GET /api/milestones/be96376a-…` | status OPEN, submission null | PASS | — |
| 18–19 | Student One | Existing Team Alpha milestone "Milestone test" (due 16 Nov 2026 20:25, badge MISSED) | "Submission closed: deadline passed"; no form. Server check: `POST …/submission` → 422 `DEADLINE_PASSED` | PASS | E-B02c |

## UAT-03: Single submission, teammate edit and feedback lock — PASS

| Step | Role | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 1–4 | Student One | Submit `UAT-03 Initial Draft by S1`, `https://github.com/example/alpha/draft-1`, `Initial upload` on `UAT-Alpha-03 Submission Lifecycle` | Badge SUBMITTED | PASS | — |
| 5 | Student One | Look for a second submit option | "Submit work" form gone; only "Edit submission" shown. Server check (on the UAT-01 milestone): second `POST …/submission` → 409 `SUBMISSION_EXISTS`, original unchanged | PASS | E-B03 step 5 |
| 7–9 | Student Two | Open milestone | Student One's submission visible | PASS | — |
| 10–13 | Student Two | Edit to `UAT-03 Final Team Revision by S2`, `https://github.com/example/alpha/final-v1`, new description; Save changes | `PUT …/submission` → 200; new values shown; "Last updated by Student Two at 17 Nov 2026, 14:02" | PASS (see OBS-03) | E-B03a |
| server | Supervisor One | `PUT …/submission` as supervisor | 403 `FORBIDDEN` | PASS | — |
| 15–17 | Supervisor One | Open milestone | Student Two's edited version visible | PASS | — |
| 18–20 | Supervisor One | Feedback `Submission reviewed and approved for Sprint 1 baseline.` | Saved; badge FEEDBACK_GIVEN; feedback card shown | PASS | E-B03b |
| 21 | Supervisor One | Look for a second feedback form | Form removed. Server check: second `POST …/feedback` → 409 `FEEDBACK_EXISTS`; original feedback unchanged | PASS | E-B03b |
| 23–24 | Student One | Open milestone | "Locked after feedback", feedback card, no "Edit submission". Server check: `PUT …/submission` → 409 `SUBMISSION_LOCKED`; title and link unchanged | PASS | E-B03c |

## UAT-04: Tenant isolation and forbidden role access — PASS

| Step | Role | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 1–2 | Student Three | Sign in, home | Only "Beta" (members Student Four, Student Three). `GET /api/teams` returns only Beta | PASS | E-B04a |
| 3–4 | Student Three | `/teams/00000000-0000-4000-8000-0000000000a1` | "Not found or you do not have access" + "Back to my team"; no Alpha members, supervisor or milestones | PASS | E-B04b step 4 |
| 5–6 | Student Three | `/milestones/d6759f19-…` (Alpha) | "Not found or you do not have access"; no title, link or feedback | PASS | E-B04b step 6 |
| server | Student Three | GET Alpha team, Alpha milestones, Alpha milestone; GET a made-up milestone ID | All 404 `NOT_FOUND` with the same body as the made-up ID (no disclosure that Alpha exists) | PASS | — |
| server | Student Three | POST submission to Alpha open milestone; PUT Alpha submission | Both 404 `NOT_FOUND`; nothing created or changed | PASS | — |
| server | Student Three | POST feedback on an Alpha submission; POST milestone on own team Beta | Both 403 `FORBIDDEN` (feedback on a made-up submission ID also 403, so no disclosure) | PASS | — |
| 7 | Student Three | `/teams/…b1` (Beta) | Members and "No milestones yet"; no "New milestone" form | PASS | E-B04 step 7 |
| 9–10 | Supervisor Two | Sign in, home | Only "Gamma" (Student Five, Student Six). `GET /api/teams` returns only Gamma | PASS | E-B04 step 10 |
| 11–12 | Supervisor Two | `/teams/…a1` | "Not found or you do not have access" | PASS | E-B04c step 12 |
| 13–14 | Supervisor Two | `/milestones/d6759f19-…` | "Not found or you do not have access" | PASS | E-B04c step 14 |
| server | Supervisor Two | GET Alpha team, milestones, milestone; POST milestone on Alpha; POST feedback on an Alpha submission | All 404 `NOT_FOUND`; nothing created | PASS | — |
| 15–16 | Supervisor Two | Created `UAT-Gamma-04 Role Check` (Gamma had no milestone), opened it | Page shows OPEN and "No submission yet"; no Submit form or button. Server check: supervisor `POST …/submission` → 403 `FORBIDDEN`, milestone still OPEN | PASS | E-B04 step 16 |

Also checked as Student One: creating a milestone on own team Alpha → 403; recording feedback → 403.

## UAT-05: Persistence and multi-user consistency — PASS (with note)

| Step | Role | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 1–5 | Student One | Submit `UAT-Alpha-05 Persistence Verification Document`, `https://github.com/example/persistence-artifact`, description from case on `UAT-Alpha-05 Persistence Milestone` | `POST` → 201; badge SUBMITTED | PASS | — |
| 6–7 | Student One | Full page reload (the browser pane ignored Ctrl+Shift+R, so `location.reload()` was used; the network log shows a new document request and a fresh `GET /api/milestones/ca6100ad-…`) | Title, link, description and SUBMITTED unchanged | PASS | E-B05a |
| 9–11 | Student Two | Open milestone | Same title, link and description. Label reads "Last updated by Student One at 17 Nov 2026, 13:58", not "Submitted by Student One" (see OBS-02); attribution to Student One is correct | PASS (note) | E-B05b |
| 13–16 | Supervisor One | Feedback `Verified persistent deliverable state.` | Saved; badge FEEDBACK_GIVEN | PASS | E-B05 step 16 |
| 17–20 | Student One | Logged out; reloaded the app fresh on the milestone URL (the pane keeps a single tab, so "close all tabs" was done as logout + fresh page load); signed in again | Submission, feedback "Verified persistent deliverable state." and "Locked after feedback" all present; FEEDBACK_GIVEN | PASS | E-B05c |

## UAT-06: Authentication lifecycle and private route protection — PASS (with observation)

| Step | Input / action | Actual result | Status | Evidence |
|---|---|---|---|---|
| 1 | Start state | No session (`GET /api/auth/me` → 401). The browser pane is not an incognito window, but it held no session. | — | — |
| 2–3 | Open `/` signed out | Redirected to `/login`; empty form | PASS | E-B06a |
| 4–5 | Open `/teams/…a1` signed out | Redirected to `/login` | PASS | E-B06a |
| 6–7 | Log in with both fields empty | "Enter your email" and "Enter your password"; no request sent | PASS | E-B06 step 7 |
| 8–9 | `nobody@cpms.test` / `password123` | Banner "Invalid email or password"; `POST /api/auth/login` → 401 `INVALID_CREDENTIALS` | PASS | — |
| 10–11 | `s1@cpms.test` / `WrongPassword!999` | Same banner; same 401 body, byte-for-byte, as step 9 | PASS | E-B06b |
| 12–14 | Valid Student One login after being redirected from `/teams/…a1` | Landed on `/teams/…a1`: the requested page was preserved | PASS | E-B06 step 14 |
| 15 | Header and home | Header "Student One" + badge "Student"; home card "Alpha". `GET /api/auth/me` → `role: STUDENT`, `email: s1@cpms.test`. Email not shown in the header (OBS-01) | PASS (observation) | E-B06c |
| 16–17 | Log out | `POST /api/auth/logout` → 204; redirected to `/login` | PASS | — |
| 18–20 | Browser Back; API calls | Back → `/` → redirected to `/login`. `GET /api/auth/me` and `GET /api/milestones/3b8d54f8-…` → 401 `UNAUTHENTICATED` | PASS | E-B06d |

Limitation: the session cookie is HttpOnly, so we could not replay the old cookie after logout. Server-side invalidation was checked only through the browser's own requests.

---

## Observations reported to the Product Team

No defect against the CPMS Sprint 1 contract was found. After checking their contract (`docs/srs.md`, `docs/sprints/sprint-1/F-04-submission.md`, `docs/sprints/sprint-1/sts.md`, `docs/system-sds.md` at commit `a11fdc0`), the item first logged as FIND-01 was reclassified as OBS-03: their AC-16 says an edit stores "the new submittedBy", TEST-19 expects submittedBy S2, and the SDS calls the relation "last submitted by".

| ID | Case / step | UAT text expects | App behaviour | Contract reference | Suggested disposition |
|---|---|---|---|---|---|
| OBS-01 | UAT-06 step 15 | Header shows name, email and role | Header shows name and role; email returned by `/api/auth/me` and shown in the members table | FR-03 "retrieve their identity"; AC-01 via `/api/auth/me` | Not-defect; fix case text (or enhancement) |
| OBS-02 | UAT-05 step 11 | "Submitted by Student One" | "Last updated by Student One at 17 Nov 2026, 13:58" | F-04 UI spec "Last updated by NAME at TIME" | Not-defect; fix case text |
| OBS-03 | UAT-05 §2 item 3 with UAT-03 step 13 | Original submitter preserved | After S2's edit, `submittedBy` = Student Two; `submittedAt` still S1's 06:58:07Z | AC-16, TEST-19, SDS "last submitted by" | Not-defect for Sprint 1; possible F-06 enhancement |

Sent to the Product Team as the shared report "UAT Report for CPMS Sprint 1 (from the PMELS team)" on 17 Nov 2026; their triage is due by 20 Nov.

## Sprint 1 decision (pending their reply)

No critical, major, minor defect or blocked result. If all three observations stay not-defect or enhancement, record **Accepted** for CPMS Sprint 1 on `v0.1.0`, with both tester names, the date and the confirmed revision. If one is reclassified as a defect, re-test the fix in Session 3 first.
