# Message to PMELS (round 2 retest), paste into Discord

Hi Tana and Thanaphon,

The fix for **UF-EX-01** (Issue https://github.com/KanPhacharawat/softwareengineering-project/issues/61) is deployed to the same test system. Could you please run round 2?

**What changed**
- PR https://github.com/KanPhacharawat/softwareengineering-project/pull/62 (reviewed by James, CI green)
- The lock after feedback now applies to every student of the team, in the server check and on the page.
- Regression test TEST-27 (teammate edits after feedback → 409) failed before the fix (RED) and passes after it (GREEN, 84/84).

**Test system**
- URL: https://cpms-lab6-wpsgfzameq-as.a.run.app/
- Version: commit `05c6fb5` (lab6-exercise), Cloud Run service `cpms-lab6`, revision `cpms-lab6-00004-c2m`
- Accounts: sup1, s1, s2 @cpms.test, same password as before.
- The live release (https://cpms-wpsgfzameq-as.a.run.app, v0.1.0, revision cpms-00005-78z) is still unchanged.

**Please re-run UAT-EX-01 in full on a new milestone `LAB6-EX-<HHMM>`**, as in round 1:
1. sup1 creates the milestone in Team Alpha, due 7 days ahead.
2. s1 submits `Exercise v1`, `https://example.com/v1`.
3. sup1 gives feedback `Reviewed, locked`.
4. s2 opens the milestone. Expected: "Locked after feedback", no Edit button.
5. s2 sends the edit directly (`PUT /api/milestones/<id>/submission` with title `Changed after feedback`). Expected: 409 `SUBMISSION_LOCKED`; after reload the title is still `Exercise v1` and the submitter is still Student One.

Please record tester, date/time, version (commit + revision), PASS/FAIL per step, actual result and screenshots, and then your **decision for this exercise** (Accepted / Accepted with limitations / Not Accepted) with reasons. We will close Issue #61 after your retest.

Milestone `LAB6-EX-2110` from round 1 stays as evidence of the defect.

Thank you!
Kan and James (CPMS, Theme 6)
