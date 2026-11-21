# Lab 6 — Cross-team UAT & Defect Management (index)

**Our team:** PMELS, Theme 7 — Personal Money and Expense Logging System
(Tana Udompornkul 67070503418 · Thanaphon Ratchatakulpong 67070503417)
**Partner team:** CPMS, Theme 6 — Course Project Management System
(Kan = Phacharawat Eakgawatphokhin 67070503426 · James = Chaiyaphoom Chenchirotphiphat 67070503410)

## Folder layout

```
docs/labs/lab6/
├── README.md                      ← this index
├── our-team/                      ← written by PMELS
│   ├── 00-uat-handoff-to-cpms.md            our UAT handoff (release, accounts, UAT-01..05, severity, decision record)
│   ├── 01-uat-results-on-cpms.md            our Part B run of CPMS's UAT-01..06
│   ├── 02-uat-report-to-cpms.md             findings sent to CPMS (UF-01..03)
│   ├── 03-triage-reply-to-cpms.md           our triage of CPMS's findings on PMELS (#54/#55/#56)
│   ├── 04-retest-request-uf-02.md           re-test request after fixing UF-02 (#55)
│   ├── 05-uat-ex-01-round1-report-to-cpms.md   controlled defect exercise, round 1 (FAIL, UF-EX-01)
│   ├── 06-uat-ex-01-round2-reply-to-cpms.md    controlled defect exercise, round 2 (PASS, Accepted)
│   └── 07-reply-to-cpms-retest-results.md   our reply to CPMS's final re-test/acceptance
└── partner-team/                  ← written by CPMS
    ├── cpms-uat-package/                    CPMS handoff + UAT-01..06 cases we executed
    ├── 01-cpms-uat-results-on-pmels.md      Kan's results on our app (17–18 Nov)
    ├── 02-cpms-console-evidence-log.txt     Kan's console/API evidence log
    ├── 03-controlled-exercise-round1-request.md
    ├── 04-controlled-exercise-round2-request.md
    └── 05-cpms-retest-and-acceptance.md     James's re-test + signed acceptance (21 Nov)
```

`our-team/00-uat-handoff-to-cpms.md` is a markdown copy of the live handoff Doc: https://claude.ai/artifact/UTcksQ91Yi9TrhCZBEnrb8

## PMELS releases under test

| Tag | Commit | Cloud Run revision | Used for |
|---|---|---|---|
| `v1.0.0-uat` | `d5cbb13` | `pmels-00008-85b` | CPMS UAT sessions 17–18 Nov |
| `v1.0.1-uat` | `83371f7` | `pmels-00009-rwp` (Deploy demo run #6) | UF-02 fix; re-test + **Accepted** 21 Nov 14:52 |

URL: https://pmels-203670311966.asia-southeast1.run.app

## Defect chain (CPMS findings on PMELS)

| Finding | Issue | Triage | Outcome |
|---|---|---|---|
| UF-01 register/login 500 | #54 | Not a defect (Cloud SQL stopped) | Not re-tested |
| UF-02 balance card stale after opening balance (D-01) | #55 | Accepted, Minor | RED `a08ad14` → GREEN `e88988c`, PR #57 → lab6-staging, PR #58 → main; verified fixed on v1.0.1-uat |
| UF-03 category Current balance shows 0 | #56 | Enhancement → Sprint 2 | Not re-tested |

## CPMS side

- CPMS v0.1.0, commit `a11fdc0`, revision `cpms-00005-78z`: our run = 6 PASS, 3 observations.
- Controlled exercise UAT-EX-01 on `cpms-lab6`: round 1 FAIL → UF-EX-01 (Issue #61, PR #62) → round 2 PASS, Accepted.

## Note on IDs

`our-team/01` uses **OBS-01..03**; the same items are **UF-01..03** in `our-team/02`. (CPMS also uses UF-01..03 for *their* findings on our app — different items.)
