# UAT-EX-01 round 1: result and defect report (from PMELS to CPMS)

**To:** Kan and James (CPMS, Theme 6)
**From:** Tana Udompornkul (67070503418) and Thanaphon Ratchatakulpong (67070503417), PMELS UAT Team (Theme 7)
**Exercise:** Lab 6 §3.5 controlled defect exercise, round 1

## Result

| Item | Value |
|---|---|
| Case | UAT-EX-01 (AC-18, BR-07): a teammate cannot edit a submission after feedback |
| Tested system | https://cpms-lab6-wpsgfzameq-as.a.run.app (isolated exercise copy; the live release was not touched) |
| Version | commit `c6e111c` (lab6-exercise), Cloud Run service `cpms-lab6`, revision `cpms-lab6-00003-4z4`, as given in your message. The app does not display its version. |
| Readiness | `GET /api/ready` → `{"ok":true,"database":"up"}` at 21:09 |
| Testers | Tana Udompornkul and Thanaphon Ratchatakulpong (we signed in to each account ourselves; AI assistance (Claude) drove the browser steps and is declared in our report) |
| Date and time | 20 Nov 2026, 21:10–21:14 (UTC+7) |
| Accounts | `sup1`, `s1`, `s2` @cpms.test (password from your handoff) |
| Milestone used | `LAB6-EX-2110`, Team Alpha, id `5545aab5-39bc-4092-84cf-1cad690c2152`, due 27 Nov 2026 21:10 |
| Submission | id `08253f76-ed31-4a2f-9178-b0d3e58eb48d` |
| **Overall** | **FAIL**: step 4 FAIL, step 5 FAIL → finding **UF-EX-01** |

| Step | Account | Action | Actual result | Result | Evidence |
|---|---|---|---|---|---|
| 1 | sup1 | Create `LAB6-EX-2110` in Team Alpha, due 27 Nov 2026 21:10 | `POST /api/teams/…a1/milestones` → 201; listed as OPEN | PASS (setup) | EV-EX01-step1 |
| 2 | s1 | Submit title `Exercise v1`, link `https://example.com/v1` | `POST …/submission` → 201; SUBMITTED; "Last updated by Student One at 20 Nov 2026, 21:11" | PASS (setup) | EV-EX01-step2 |
| 3 | sup1 | Feedback `Reviewed, locked` | `POST /api/submissions/08253f76-…/feedback` → 201; FEEDBACK_GIVEN; "Recorded by Supervisor One on 20 Nov 2026, 21:12" | PASS (setup) | EV-EX01-step3 |
| 4 | s2 | Open the milestone | Badge FEEDBACK_GIVEN and the feedback card are shown, but there is **no "Locked after feedback" notice** and the **"Edit submission" button is shown** | **FAIL** | EV-EX01-step4 |
| 5 | s2 | Edit: change title to `Changed after feedback`, Save changes, reload | `PUT /api/milestones/5545aab5-…/submission` → **200**. After a full reload the title is **"Changed after feedback"**, "Last updated by Student Two at 20 Nov 2026, 21:13". Expected: rejected, title still `Exercise v1`. | **FAIL** | EV-EX01-step5 (×2) |

---

## Defect report UF-EX-01

| Field | Detail |
|---|---|
| Finding ID | UF-EX-01 |
| Title | A teammate who is not the stored submitter can edit a submission after feedback (UI and API) |
| Product / team | CPMS (Theme 6), James and Kan |
| Reporter | Tana Udompornkul, Thanaphon Ratchatakulpong (PMELS UAT Team) |
| Tested version | `c6e111c`, `cpms-lab6`, revision `cpms-lab6-00003-4z4`, https://cpms-lab6-wpsgfzameq-as.a.run.app |
| Date and time | 20 Nov 2026, 21:13–21:14 (UTC+7) |
| Linked case / requirement | UAT-EX-01 steps 4–5; AC-18; BR-07 (a submission is locked after feedback) |
| Preconditions / data | Team Alpha milestone with a submission by Student One (s1) that has feedback (FEEDBACK_GIVEN). Student Two (s2) is a Team Alpha member and is **not** the stored `submittedBy`. |
| Steps to reproduce | 1. As sup1, create a milestone for Team Alpha. 2. As s1, submit on it. 3. As sup1, record feedback. 4. As s2, open the milestone. 5. Click **Edit submission**, change the title, click **Save changes**, reload. |
| Expected | Step 4: "Locked after feedback" notice, no Edit button. Step 5: the change is rejected (the live release returns 409 `SUBMISSION_LOCKED`), and the title stays `Exercise v1`. |
| Actual | Step 4: Edit button shown, no lock notice. Step 5: `PUT` → 200 and the change is stored. `GET /api/milestones/5545aab5-…` afterwards returns `title: "Changed after feedback"`, `submittedBy: Student Two`, `updatedAt: 2026-11-20T14:13:52.299Z` (after the feedback `createdAt: 2026-11-20T14:12:47.373Z`), status still FEEDBACK_GIVEN with the original feedback attached. |
| Proposed severity | **Critical**. The server accepts a forbidden operation and changes stored data: a deliverable can be replaced after the supervisor has assessed it, so the feedback no longer matches the work. There is no workaround that prevents it. Please adjust if your severity scale says otherwise. |
| Evidence | EV-EX01-step4 (Edit button, no lock notice), EV-EX01-step5 (edit saved), EV-EX01-step5 after reload (change persisted), plus the API responses above |

### Diagnostic observation (to help you find the cause)

After the edit, `submittedBy` became Student Two. The page then **did** show "Locked after feedback" and hid the Edit button for Student Two. We then sent the same unchanged values again (`PUT` with title `Changed after feedback`, link `https://example.com/v1`, so no data could change). The server returned **409 `SUBMISSION_LOCKED`**.

So the lock seems to be enforced only for the user stored as `submittedBy`. Any **other** member of the team bypasses it, in both the page and the API, until their edit makes them the stored submitter. On the live release (v0.1.0, 17 Nov), the same scenario returned 409 for the non-submitter, so this looks like the injected regression in the lock check rather than in the UI alone.

### Data left on the exercise system

Milestone `LAB6-EX-2110` now holds the edited submission ("Changed after feedback", by Student Two) with the original feedback. Please keep it as evidence. For round 2, a new milestone `LAB6-EX-<HHMM>` gives a clean run.

---

## Round 2

When the fix is deployed to the same URL, send us the new commit and revision. We will re-run UAT-EX-01 in full on a new milestone and add one extra check: we will also try the edit directly with `PUT` as s2, so the server rejects it and not only the page. Then we will record our decision for this exercise. Please also tell us which GitHub Issue number you file this under.
