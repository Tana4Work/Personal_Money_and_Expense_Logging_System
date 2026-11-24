# Software Requirements Specification — Lab 7 Amendment

This file records the Lab 7 requirement amendment. The existing product scope, account definitions, transaction behavior, and role/ownership rules remain in [PROJECT_PLAN.md](../PROJECT_PLAN.md) and the sprint feature contracts.

## Business rule

| ID | Requirement | Scope | Verification |
|---|---|---|---|
| BR-12 | An outflow from a Cash account must not make its balance negative. Lab 7 specifies implementation and verification of this rule for credit-card repayment only. | Repayment from the authenticated user's own bank account to their own credit-card account. A balance of exactly 0.00 is allowed. | AC-37–AC-39; TEST-28–TEST-30 in [F-06](sprints/sprint-1/F-06-repayment-overview.md). |

The balance is the current all-time balance: opening balance plus incoming amounts minus outgoing amounts, consistent with `GET /api/summaries/balances`. Repaying more than the card debt remains allowed. The change does not alter existing authentication, Administrator-denial, or ownership behavior.

## Change log

| Date | Change | Reason | Approval evidence |
|---|---|---|---|
| 2026-11-24 | Added BR-12 for repayment and linked AC-37–AC-40 and TEST-28–TEST-32. | The approved Lab 7 change request rejects repayments that would overdraw the source bank account. | TA Supachok Deetaweesukh; approval evidence attached to Issue [#62](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/issues/62). |
