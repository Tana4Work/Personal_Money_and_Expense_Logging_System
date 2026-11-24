# Issue #65: v1.1.0 post-deployment checks

## Release record

- Release PR: #69, merged to `main` on 2026-11-24.
- Tag: `v1.1.0` at commit `8d0d4b18a1c564a05f857fe3d8e34505bcbb1a81`.
- Deployment run: [45373425293](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/actions/runs/45373425293), completed successfully.
- Deployment time: 2026-11-24 10:20:37 UTC (2026-11-24 17:20:37 +07:00).
- Cloud Run revision: `pmels-00011-rw4`, serving 100% of traffic.
- Service: `https://pmels-203670311966.asia-southeast1.run.app`.
- Deployment smoke test: health, readiness/database, and app page passed. Optional login was skipped because `SMOKE_EMAIL` and `SMOKE_PASSWORD` were not configured.

## Manual post-deployment checks

Target revision for all checks: `pmels-00011-rw4`.

| # | Check | Result | Time (Asia/Bangkok) | Evidence |
|---|---|---|---|---|
| 1 | Repayment above the bank balance returns 400 and leaves balances unchanged. | PASS — HTTP 400 with `{"error":"Insufficient bank balance for this repayment."}`; balance responses before and after matched (500). | 2026-11-24 17:35:06 +07:00 test run start | Result recorded from the timestamped live API run below. |
| 2 | Repayment leaving exactly 0.00 returns 201. | PASS — HTTP 201; subsequent bank balance was `0`. | 2026-11-24 17:35:06 +07:00 test run start | Result recorded from the timestamped live API run below. |
| 3 | Repayment using another user's bank account returns 403. | PASS — HTTP 403. | 2026-11-24 17:35:57–17:35:58 +07:00 | Result recorded from the timestamped live API run below. |
| 4 | Administrator financial request returns 403. | PASS — admin login returned 200; repayment request returned HTTP 403 with `{"error":"User access is required."}`. | 2026-11-24 18:26:55–18:26:56 +07:00 | Authorized credential read from the ignored local test file; values not recorded. |
| 5 | Normal opening-balance, salary, card-purchase, and repayment journey persists. | PASS — salary, purchase, and repayment returned 201; transaction history returned 200 and contained the recorded flows. | 2026-11-24 17:35:06 +07:00 test run start | Result recorded from the timestamped live API run below. |

Additional concurrency check on a synthetic user: two concurrent repayments of 300 returned one 201 and one 400. The resulting bank balance was 150 and remained non-negative. This is consistent with the 450 balance immediately before the concurrent requests. The verification script exited nonzero because its assertion incorrectly expected 400; the observed 150 is the correct result. This run started at 2026-11-24 17:35:06 +07:00.

Timestamped live API output summary (local time, revision `pmels-00011-rw4`):

```text
2026-11-24T17:35:06+07:00
PASS over-balance repayment: HTTP 400; balances unchanged
PASS exact-zero repayment: HTTP 201; bank balance 0
PASS normal journey: salary 201, card purchase 201, repayment 201, history 200
PASS concurrent repayments: one 201, one 400; observed bank balance 150
2026-11-24T17:35:57–17:35:58+07:00
PASS cross-owner source denied: HTTP 403
2026-11-24T18:26:55–18:26:56+07:00
Administrator login: HTTP 200; repayment denied: HTTP 403
```

The API-check timestamps are the start times of the corresponding scripts; individual request timestamps were not emitted by the client. All five post-deployment checks now pass for revision `pmels-00011-rw4`.

## Test data note

Synthetic verification users were registered through F-07 in the deployed service. The project API has no user-deletion operation, so these synthetic profiles remain in the database.
