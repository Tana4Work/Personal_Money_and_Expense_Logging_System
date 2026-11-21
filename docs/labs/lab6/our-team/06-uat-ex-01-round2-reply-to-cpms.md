# UAT-EX-01 round 2: re-test result and decision (from PMELS to CPMS)

Hi Kan and James,

We re-ran UAT-EX-01 on your fixed exercise system. **All steps pass.** A teammate can no longer edit a submission after feedback, in the page or through the API. Our decision for this exercise is **Accepted**. Details are below, and you can close Issue #61.

## Re-test details

| Item | Value |
|---|---|
| Case | UAT-EX-01 (AC-18, BR-07): a teammate cannot edit a submission after feedback |
| Finding re-tested | UF-EX-01 (Issue #61), fixed by PR #62 |
| Tested system | https://cpms-lab6-wpsgfzameq-as.a.run.app |
| Version | commit `05c6fb5` (lab6-exercise), Cloud Run service `cpms-lab6`, revision `cpms-lab6-00004-c2m`, as given in your message. The app does not display its version. |
| Readiness | `GET /api/ready` → `{"ok":true,"database":"up"}` at 13:00 |
| Testers | Tana Udompornkul (67070503418) and Thanaphon Ratchatakulpong (67070503417), PMELS UAT Team. We signed in to each account ourselves; AI assistance (Claude) drove the browser steps and is declared in our report. |
| Date and time | 21 Nov 2026, 13:00–13:05 (UTC+7) |
| Accounts | `sup1`, `s1`, `s2` @cpms.test |
| New milestone | `LAB6-EX-1301`, Team Alpha, id `46880103-3951-4d3f-a883-822a6e1f59ac`, due 28 Nov 2026 13:01 |
| Submission | id `dafe7d1d-2ebd-44f6-b6ee-1a9f768c1aee` |
| **Overall** | **PASS** (steps 4 and 5 PASS; steps 1–3 set up correctly) |

| Step | Account | Action | Actual result | Result | Evidence |
|---|---|---|---|---|---|
| 1 | sup1 | Create `LAB6-EX-1301` in Team Alpha, due 28 Nov 2026 13:01 | `POST /api/teams/…a1/milestones` → 201; listed OPEN. Round 1 milestone `LAB6-EX-2110` still present (FEEDBACK_GIVEN). | PASS (setup) | EV-EX01R2-step1 |
| 2 | s1 | Submit `Exercise v1`, `https://example.com/v1` | `POST …/submission` → 201; SUBMITTED; "Last updated by Student One at 21 Nov 2026, 13:02" | PASS (setup) | EV-EX01R2-step2 |
| 3 | sup1 | Feedback `Reviewed, locked` | Saved; FEEDBACK_GIVEN; "Recorded by Supervisor One on 21 Nov 2026, 13:03" | PASS (setup) | EV-EX01R2-step3 |
| 4 | s2 | Open the milestone | **"Locked after feedback"** notice shown; **no Edit button** (in round 1 the button was shown at this step) | **PASS** | EV-EX01R2-step4 |
| 5 | s2 | `PUT /api/milestones/46880103-…/submission` with title `Changed after feedback`; reload | `PUT` → **409** `{"code":"SUBMISSION_LOCKED","message":"Submission is locked after feedback"}`. After a full reload: title **Exercise v1**, link `https://example.com/v1`, **Last updated by Student One**, FEEDBACK_GIVEN, feedback unchanged. | **PASS** | EV-EX01R2-step5, API responses below |

### Extra checks we added (all PASS)

| Check | Request (as s2) | Response |
|---|---|---|
| Edit that also changes link and description | `PUT …/submission` with link `https://example.com/changed` and a description | 409 `SUBMISSION_LOCKED` |
| Create a second submission instead | `POST …/submission` | 409 `SUBMISSION_EXISTS` |
| Stored record after all attempts | `GET /api/milestones/46880103-…` | title `Exercise v1`, link `…/v1`, submittedBy **Student One**, `updatedAt` 2026-11-21T06:02:16Z (before the feedback at 06:03:01Z), feedback `Reviewed, locked` |

Round 1 showed the cause was a lock that applied only to the stored submitter. In round 2 the non-submitter teammate is now blocked both in the page and on the server, which is the same behaviour as your live release v0.1.0 on 17 Nov.

**Not covered by this re-test:** we did not check that a teammate can still edit **before** feedback (your AC-16 / UAT-03). Your full test run (84/84 GREEN) should cover that. If you want independent evidence, ask us and we will run it.

## Decision for the controlled defect exercise

| Field | Entry |
|---|---|
| Release | `cpms-lab6`, commit `05c6fb5`, revision `cpms-lab6-00004-c2m` (exercise system only) |
| Date and time | 21 Nov 2026, 13:05 (UTC+7) |
| Cases run | UAT-EX-01: PASS |
| Finding re-tested | UF-EX-01 (Issue #61): fixed and verified on the version above |
| **Decision** | **Accepted** |
| Limitations | None |
| Reasons | The defect reproduced in round 1 (`PUT` → 200 and the change stored) is fixed. In round 2 the page hides Edit and shows the lock, and the server rejects every edit by a non-submitter teammate with 409 while the stored submission stays unchanged. |
| Signed | Tana Udompornkul, 21 Nov 2026 · Thanaphon Ratchatakulpong, 21 Nov 2026 |

Data left on the exercise system: `LAB6-EX-2110` (round 1 defect evidence, edited submission) and `LAB6-EX-1301` (round 2, locked submission unchanged).

Our acceptance decision for your live release `v0.1.0` stays as agreed after your reply on UF-01 to UF-03.

Thank you for the quick fix!
Tana and Thanaphon (PMELS, Theme 7)
