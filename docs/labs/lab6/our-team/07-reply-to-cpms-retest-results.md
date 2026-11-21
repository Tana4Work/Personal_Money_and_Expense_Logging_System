# Reply to CPMS: Sprint 1 re-test results received

Hi James and Kan,

Thank you for the re-test and for accepting our Sprint 1 release. We checked your results against our own deployment records, and everything matches.

## What we confirm

| Item | Your record | Our record | Match |
|---|---|---|---|
| Release | `v1.0.1-uat` · `83371f7` · `pmels-00009-rwp` | Tag `v1.0.1-uat` → `83371f70a93856e349b84a124ff4712022783ee8` (release PR #58); Deploy demo run #6 deployed revision `pmels-00009-rwp` on 20 Nov 2026, smoke test passed. Nothing has been deployed since, so your 21 Nov 14:46–14:52 session ran on this revision. | ✅ |
| UF-02 (Issue #55) | Fixed: Bank balance card and Current balance show 10000 immediately after saving | Fix PR #57 (RED test `a08ad14`, GREEN fix `e88988c`), reviewed, CI passed | ✅ |
| Regression | UAT-01 steps 4–7 and UAT-04 unchanged (39000 / 500 / 30000 / 1500; old token 401) | Same as your 18 Nov results on `v1.0.0-uat` | ✅ |
| Decision | **Accepted**, no limitations | Recorded as our final Sprint 1 acceptance | ✅ |

## Status of our Issues after your re-test

| Finding | Issue | Status |
|---|---|---|
| UF-01: database stopped on 17 Nov | #54 | Closed as not-defect (operations incident, no code change); process changed |
| UF-02: stale bank balance (D-01) | #55 | **Closed**: fixed in `v1.0.1-uat` and verified by your re-test |
| UF-03: category balances show 0 | #56 | Open as an enhancement for Sprint 2 (category summaries); no Sprint 1 change |

## Three small additions to your Section 7, please

Our handoff's acceptance record asks for a few fields that your table does not have yet. Adding them makes the record complete for both teams' reports:

1. **Date and time of the decision**, for example `21 Nov 2026, 14:52 (UTC+7)`.
2. **Signatures from both testers**: name and date for Kan and for James.
3. **Which release each case ran on.** UAT-02, UAT-03 and UAT-05 ran on `v1.0.0-uat` (`d5cbb13` / `pmels-00008-85b`) on 18 Nov, not on `v1.0.1-uat`. The lab says acceptance applies to the exact release recorded. We suggest wording such as:
   > UAT-02, UAT-03, UAT-05: PASS on `v1.0.0-uat` (18 Nov 2026); not re-run because the #55 fix changes only the client refresh after saving an opening balance (no API, data or access change); UAT-01 and UAT-04 re-run on `v1.0.1-uat` as regression.

If you would rather re-run those three cases on `v1.0.1-uat` instead, that also works. The site stays up and unchanged until grading, and we will not deploy without telling you first.

It would also help to list UF-01 and UF-03 in your "Finding retest status" table, with "not re-tested: not-defect" and "not re-tested: enhancement (#56)", so every finding you raised has a final status.

Thanks again for testing carefully. Your console evidence in session 2, where `/api/summaries/balances` already showed 10000, made the UF-02 cause easy to confirm.

Tana and Thanaphon (PMELS, Theme 7)
