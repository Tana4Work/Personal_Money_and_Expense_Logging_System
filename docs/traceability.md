# Lab 7 Requirement Traceability Amendment

| Requirement / criterion | Contract location | Verification | Preserved behavior |
|---|---|---|---|
| BR-12: a repayment must not make the source Cash account balance negative. | [SRS amendment](srs.md); [F-06](sprints/sprint-1/F-06-repayment-overview.md) | AC-37–AC-39; TEST-28–TEST-30 | Scope is repayment only. |
| AC-37: reject a repayment that exceeds the available source balance, without writes or leaking a balance. | F-06 Lab 7 test specifications | TEST-28 | Existing authentication and ownership checks remain first. |
| AC-38: allow repayment to exactly 0.00. | F-06 Lab 7 test specifications | TEST-29 | — |
| AC-39: prevent competing repayments from overdrawing the source account. | F-06 Lab 7 test specifications; [SDS amendment](system-sds.md) | TEST-30 | Balance check and writes use one transaction with a source-account row lock. |
| AC-40: show the server rejection on the repayment form. | F-06 Lab 7 test specifications | TEST-31 | No client-side balance pre-check. |
| Preserve card overpayment. | F-06 Lab 7 test specifications | TEST-32 | Repayment above the card debt remains accepted. |
