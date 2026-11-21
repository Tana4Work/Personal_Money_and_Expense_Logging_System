# UAT Report for CPMS Sprint 1 (from the PMELS team)

**Date:** 17 November 2026
**To:** CPMS Product Team — James (`maneejames`), Kan (`KanPhacharawat`), Theme 6
**From:** PMELS UAT Team — Tana Udompornkul (67070503418), Thanaphon Ratchatakulpong (67070503417), Theme 7
**Course:** CPE334 Lab 6, Part B (independent execution) and Part C (outgoing finding reports)

---

## 1. Summary

All six CPMS Sprint 1 UAT cases passed on release **v0.1.0**. We found no failure of your Sprint 1 contract and no blocked steps. We report **three findings** where your UAT case text expects something different from what the application does; in each case the application matches your contract, so we expect them to be triaged as not-defect or enhancement. Please triage them in writing (section 3).

| Item | Value |
|---|---|
| Tested release | Tag `v0.1.0` (confirmed by you); deployed commit `a11fdc0` per your handoff |
| Tested URL | https://cpms-861207197457.asia-southeast1.run.app (your handoff lists `https://cpms-wpsgfzameq-as.a.run.app`; both are Cloud Run URLs of service `cpms`) |
| Session | 17 Nov 2026, 13:45–14:11 (UTC+7), one continuous session. `/api/ready` returned `{"ok":true,"database":"up"}` at the start. |
| Accounts | Seeded accounts with the password from your private handoff: `sup1`, `sup2`, `s1`, `s2`, `s3` |
| Method | Manual testing in a desktop browser, plus server checks sent from the signed-in tab with the browser console (same cookie session as the UI). Both testers took part and signed in to run cases. We used AI assistance (Claude) to drive the browser steps and declare this in our own report. |
| Outcome | 6 PASS, 0 FAIL, 0 BLOCKED; 3 findings for triage (UF-01 to UF-03) |
| Proposed Sprint 1 decision | **Accepted**, to be recorded after you triage the three findings. If you reclassify one as a defect, we re-test the fix in Session 3 and decide then. |

---

## 2. Results by case

Every case ran in its documented step order; we grouped the runs by account to reduce sign-ins. Evidence IDs follow your `E-Bxx` scheme; screenshots are in our repository and our PDF.

| Case | Category | Tested by | Time (UTC+7) | Result | What we observed | Evidence |
|---|---|---|---|---|---|---|
| UAT-01 | Normal journey | Tana, Thanaphon | 13:53–14:07 | PASS | Milestone created OPEN (201); S1 submission → SUBMITTED with clickable link; Sup1 feedback → FEEDBACK_GIVEN with "Recorded by Supervisor One"; S1 then sees "Locked after feedback" and no Edit button | E-B01a, E-B01b, E-B01c |
| UAT-02 | Boundary / deadline | Tana, Thanaphon | 13:52–13:57 | PASS | Title `AB`, past due date, title `No`, FTP link and plain-text link all blocked with the expected inline messages; sandbox stayed OPEN with no submission; past-due "Milestone test" shows "Submission closed: deadline passed" | E-B02a, E-B02b, E-B02c |
| UAT-03 | Submission lifecycle | Tana, Thanaphon | 13:58–14:07 | PASS (see UF-03) | One submission only (Edit replaces Submit); S2 edit saved and shown as "Last updated by Student Two"; feedback form removed after feedback; S1 locked out of editing | E-B03a, E-B03b, E-B03c |
| UAT-04 | Tenant isolation / roles | Tana, Thanaphon | 14:08–14:11 | PASS | S3 sees only Beta, Sup2 only Gamma; both get "Not found or you do not have access" on Team Alpha and its milestone; no milestone form for S3; no Submit form for Sup2 | E-B04a, E-B04b, E-B04c |
| UAT-05 | Persistence | Tana, Thanaphon | 13:58–14:07 | PASS (see UF-02, UF-03) | Submission unchanged after a full page reload; S2 sees identical data; feedback and lock still present after S1 signs in again | E-B05a, E-B05b, E-B05c |
| UAT-06 | Auth lifecycle | Tana, Thanaphon | 13:45–13:53 | PASS (see UF-01) | Signed-out `/` and `/teams/…` redirect to `/login`; empty-form messages; unknown email and wrong password give the identical 401 body; login returns to the requested page; logout → 204, Back redirects to `/login`, API calls 401 | E-B06a–E-B06d |

**How two steps were run:**

- UAT-05 step 6: the browser pane we used ignored Ctrl+Shift+R, so we forced a full reload with `location.reload()`. The network log shows a new document request and a fresh `GET /api/milestones/ca6100ad-…`.
- UAT-05 step 17 and UAT-06 step 1: the pane keeps a single tab and is not an incognito window. We logged out and reloaded the app instead, and confirmed `GET /api/auth/me` returned 401 before signing in again.

---

## 3. Findings for triage

Each finding below is an actual difference between your UAT case text and what we observed. For each one we also quote your Sprint 1 contract, because in all three the application matches the contract. Please record for each: classification (accepted defect, duplicate, not-defect or enhancement), the reason tied to your contract, and the GitHub Issue number if you open one.

| ID | Case / step | Summary | Proposed severity | Our suggested classification |
|---|---|---|---|---|
| UF-01 | UAT-06 step 15 | Header does not show the user's email | Minor (display only) | Not-defect (FR-03 is met through the API); or enhancement |
| UF-02 | UAT-05 step 11 | Label reads "Last updated by", case expects "Submitted by" | Minor (wording only) | Not-defect (matches F-04 UI spec) |
| UF-03 | UAT-05 §2 item 3, with UAT-03 step 13 | Editing a submission replaces the original submitter | Minor (audit trail; no data exposed) | Not-defect for Sprint 1 (matches AC-16); possible F-06 enhancement |

Severity explains user impact if you decide to treat the item as a defect. None of the three exposes data, blocks a journey or changes stored content.

### UF-01: Header does not show the user's email

| Field | Detail |
|---|---|
| Finding ID | UF-01 |
| Product / team | CPMS — James (`maneejames`), Kan (`KanPhacharawat`) |
| Reporter | Tana Udompornkul, Thanaphon Ratchatakulpong (PMELS UAT Team) |
| Tested version | `v0.1.0`, commit `a11fdc0`, https://cpms-861207197457.asia-southeast1.run.app |
| Date and time | 17 Nov 2026, 13:51 (UTC+7) |
| Linked case / requirement | UAT-06 step 15 and §7 ("header displays identity (Student One, STUDENT, `s1@cpms.test`)"); handoff §2.1 F-01 ("display of authenticated user identity (Name, Email, Role)"); FR-03 |
| Preconditions / data | Seeded account `s1@cpms.test` (Student One, Team Alpha); no prior session |
| Steps to reproduce | 1. Open `/login`. 2. Sign in as `s1@cpms.test`. 3. Look at the top bar on any page. |
| Expected (your UAT-06 §7) | Header shows Student One, the STUDENT role and `s1@cpms.test` |
| Actual | Header shows "Student One" and the role badge "Student" only. The email is not shown in the header. `GET /api/auth/me` returns `{"email":"s1@cpms.test","name":"Student One","role":"STUDENT"}`, and the email appears in the team members table. |
| Contract reference | FR-03: "A logged-in user can retrieve their identity (id, name, email, role)." AC-01 verifies this through `/api/auth/me`. |
| Proposed severity | Minor: the user can still see who is signed in; nothing is exposed or blocked |
| Suggested classification | Not-defect: FR-03 is met. Update the UAT-06 expected result and the handoff wording, or log an enhancement if you want the email in the header. |
| Evidence | E-B06c (home and header as Student One) |

### UF-02: Submission label reads "Last updated by" instead of "Submitted by"

| Field | Detail |
|---|---|
| Finding ID | UF-02 |
| Product / team | CPMS — James (`maneejames`), Kan (`KanPhacharawat`) |
| Reporter | Tana Udompornkul, Thanaphon Ratchatakulpong (PMELS UAT Team) |
| Tested version | `v0.1.0`, commit `a11fdc0` |
| Date and time | 17 Nov 2026, 14:03 (UTC+7) |
| Linked case / requirement | UAT-05 step 11 ("Verify the text displays: *Submitted by Student One*") and §8 E-B05b |
| Preconditions / data | Milestone `UAT-Alpha-05 Persistence Milestone` (`ca6100ad-4fe9-4f59-a6bb-b3835025baf6`) with a submission by Student One and no edits |
| Steps to reproduce | 1. Sign in as `s2@cpms.test`. 2. Open `/milestones/ca6100ad-4fe9-4f59-a6bb-b3835025baf6`. 3. Read the line under the submission title. |
| Expected (your UAT-05) | "Submitted by Student One" |
| Actual | "Last updated by Student One at 17 Nov 2026, 13:58". The attribution to Student One is correct; only the label differs. |
| Contract reference | `docs/sprints/sprint-1/F-04-submission.md`: the card shows "Last updated by NAME at TIME" |
| Proposed severity | Minor: wording only |
| Suggested classification | Not-defect: matches your F-04 UI specification. Update the UAT-05 step 11 wording. |
| Evidence | E-B05b (Student Two's view of the UAT-05 submission) |

### UF-03: Editing a submission replaces the original submitter

| Field | Detail |
|---|---|
| Finding ID | UF-03 |
| Product / team | CPMS — James (`maneejames`), Kan (`KanPhacharawat`) |
| Reporter | Tana Udompornkul, Thanaphon Ratchatakulpong (PMELS UAT Team) |
| Tested version | `v0.1.0`, commit `a11fdc0` |
| Date and time | 17 Nov 2026, 14:02–14:03 (UTC+7) |
| Linked case / requirement | UAT-05 §2 item 3 ("Submissions accurately record and preserve the submitting author's name … without data degradation"), together with UAT-03 steps 10–13 |
| Preconditions / data | Open Team Alpha milestone without feedback: `UAT-Alpha-03 Submission Lifecycle` (`97c2f1be-9351-48fa-aa9e-1b6b32ea475a`) |
| Steps to reproduce | 1. As `s1@cpms.test`, submit on the milestone. 2. Sign out; as `s2@cpms.test`, click **Edit submission**, change any field and click **Save changes**. 3. As any Team Alpha member, call `GET /api/milestones/97c2f1be-9351-48fa-aa9e-1b6b32ea475a`. |
| Expected (your UAT-05 §2) | The original submitter (Student One) is preserved |
| Actual | The response contains `"submittedBy":{"name":"Student Two"}`, `"submittedAt":"2026-11-17T06:58:07.983Z"` (Student One's original time) and `"updatedAt":"2026-11-17T07:02:24.862Z"`. No field records Student One as the original submitter. The page shows "Last updated by Student Two at 17 Nov 2026, 14:02". |
| Contract reference | AC-16: "a PUT by a team member returns 200 and the new values are stored with the new submittedBy and updatedAt"; TEST-19 expects "submittedBy S2"; System SDS labels the relation "last submitted by" |
| Proposed severity | Minor: no data is exposed and the deliverable content is correct, but who originally submitted is lost |
| Suggested classification | Not-defect for Sprint 1: behaviour matches AC-16. Reword UAT-05 §2 item 3. Keeping the original author (and a history of editors) could be logged as an enhancement for F-06 (revision history). |
| Evidence | E-B03a (Student Two's edit), API response above |

---

## 4. Server-side checks beyond the written steps

Your form validation blocks most invalid input before any request is sent, so we also sent the same requests directly to the API. Every one was rejected, and a follow-up read confirmed nothing was stored or changed. You may cite these as independent backend evidence.

| Rule | Account | Request | Response |
|---|---|---|---|
| BR-04 title length | Sup1 | `POST /api/teams/…a1/milestones` with title `AB`, and with a 121-character title | 400 `VALIDATION_ERROR` (title), both |
| BR-04 future due date | Sup1 | Same endpoint, `dueAt` 2026-01-01T10:00+07:00 | 400 `VALIDATION_ERROR` (dueAt) |
| BR-09 link and title | S1 | `POST /api/milestones/be96376a-…/submission` with title `No`; links `ftp://…`, `my-shared-google-drive-folder`, `javascript:alert(1)` | 400 `VALIDATION_ERROR` for all four; milestone still OPEN, submission null |
| BR-06 deadline | S1 | `POST /api/milestones/3b8d54f8-…/submission` (due 16 Nov) | 422 `DEADLINE_PASSED` |
| BR-05 one submission | S1 | Second `POST` on `d6759f19-…` | 409 `SUBMISSION_EXISTS`; original unchanged |
| BR-07 lock | S1 | `PUT /api/milestones/97c2f1be-…/submission` after feedback | 409 `SUBMISSION_LOCKED`; title and link unchanged |
| BR-08 one feedback | Sup1 | Second `POST /api/submissions/80be4993-…/feedback` | 409 `FEEDBACK_EXISTS`; first feedback unchanged |
| BR-03 roles | S1 | Create milestone on own team; record feedback | 403 `FORBIDDEN`, both |
| BR-03 roles | Sup1 | `PUT` a student submission | 403 `FORBIDDEN` |
| BR-03 roles | Sup2 | `POST` a submission on own team's milestone `ae5012e0-…` | 403 `FORBIDDEN`; milestone still OPEN |
| BR-01, NFR-03 isolation | S3 | GET Team Alpha, its milestones, an Alpha milestone; POST submission to an Alpha milestone; PUT an Alpha submission | 404 `NOT_FOUND`, same body as a made-up milestone ID |
| BR-02, NFR-03 isolation | Sup2 | GET Team Alpha, its milestones, an Alpha milestone; POST milestone on Alpha; POST feedback on an Alpha submission | 404 `NOT_FOUND` for all |
| NFR-04 enumeration | none | Login with `nobody@cpms.test` and with `s1@cpms.test` + wrong password | 401, identical body `INVALID_CREDENTIALS` |
| FR-02 logout | S1 | `GET /api/auth/me` and `GET /api/milestones/3b8d54f8-…` after logout | 401 `UNAUTHENTICATED`, both |

**Design note, not a finding:** a student who posts feedback gets 403 even for another team's submission, while other cross-team requests return 404. A made-up submission ID also returns 403, so the 403 reveals nothing about whether a submission exists.

**Limitation:** the session cookie is HttpOnly, so we could not replay the old cookie after logout; we verified logout only through the browser's own requests.

---

## 5. Test data we created on your deployment

We created five synthetic milestones, following your `UAT-<team>-<caseId>` naming rule. All rejected requests in section 4 stored nothing.

| Milestone | ID | Due (UTC+7) | Created for | State after testing |
|---|---|---|---|---|
| UAT-Alpha-01 Sprint 1 Deliverable | `d6759f19-56b5-4963-bf77-188f3888fa88` | 24 Nov 2026 14:00 | UAT-01 | FEEDBACK_GIVEN, locked |
| UAT-Alpha-02 Boundary Sandbox | `be96376a-4964-446d-a7c3-e67c26163d95` | 22 Nov 2026 14:00 | UAT-02 | OPEN, no submission |
| UAT-Alpha-03 Submission Lifecycle | `97c2f1be-9351-48fa-aa9e-1b6b32ea475a` | 24 Nov 2026 14:00 | UAT-03 precondition | FEEDBACK_GIVEN, locked |
| UAT-Alpha-05 Persistence Milestone | `ca6100ad-4fe9-4f59-a6bb-b3835025baf6` | 24 Nov 2026 14:00 | UAT-05 precondition | FEEDBACK_GIVEN, locked |
| UAT-Gamma-04 Role Check | `ae5012e0-c7ba-4a48-8aa5-c4f33d227093` | 24 Nov 2026 14:00 | UAT-04 step 15 (Team Gamma had no milestone) | OPEN, no submission |

We used the existing Team Alpha milestone "Milestone test" (`3b8d54f8-…`, due 16 Nov 2026 20:25) for the deadline check and did not change it. Please leave these records in place until after Session 3; they are the evidence for the re-test.

---

## 6. What we need from you

Please reply by **20 November 2026** (your Session 2 window) so we can record the final decision in Session 3.

- [ ] Triage UF-01, UF-02 and UF-03: classification (accepted defect, duplicate, not-defect or enhancement), the reason tied to your contract, and the GitHub Issue number if you open one.
- [ ] Confirm the Cloud Run revision that served `v0.1.0` on 17 Nov 2026 between 13:45 and 14:11 (UTC+7), so our acceptance record names the exact release.
- [ ] Tell us before any deployment to the tested URL, and which cases you want re-run.
- [ ] If nothing is classified as a defect: you will need the TA's controlled defect exercise (Lab 6 §3.5) for your Part D. Send us its corrected version and reproduction steps when ready and we will re-test it independently.

**Our decision after your reply:** if all three findings are classified as not-defect or enhancement, we will record **Accepted** for CPMS Sprint 1 on `v0.1.0`, signed by both testers with the date. If you classify one as a defect, we will re-test the fixed release and then record Accepted, Accepted with documented minor limitations, or Not Accepted.

**Contact:** Tana Udompornkul and Thanaphon Ratchatakulpong, through our agreed team chat.
