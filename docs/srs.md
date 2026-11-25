# Software Requirements Specification — Lab 7 and Sprint 2 Amendments

This file records the Lab 7 requirement amendment and the Sprint 2 business-rule changes. The full SRS is consolidated for Deliverable 2 Part D (see [delivery2.md](delivery2.md)). The existing product scope, account definitions, transaction behavior, and role/ownership rules remain in [PROJECT_PLAN.md](../PROJECT_PLAN.md) and the sprint feature contracts.

## Business rule

| ID | Requirement | Scope | Verification |
|---|---|---|---|
| BR-12 | An outflow from a Cash account must not make its balance negative. Lab 7 specifies implementation and verification of this rule for credit-card repayment only. | Repayment from the authenticated user's own bank account to their own credit-card account. A balance of exactly 0.00 is allowed. | AC-37–AC-39; TEST-28–TEST-30 in [F-06](sprints/sprint-1/F-06-repayment-overview.md). |

The balance is the current all-time balance: opening balance plus incoming amounts minus outgoing amounts, consistent with `GET /api/summaries/balances`. Repaying more than the card debt remains allowed. The change does not alter existing authentication, Administrator-denial, or ownership behavior.

## Sprint 2 amendments (contracts v1.0, Issue #73)

| ID | Requirement | Scope | Verification |
|---|---|---|---|
| BR-12 (scope extended) | Unchanged wording: an outflow from a Cash account must not make its balance negative. Sprint 2 applies it to **every** Cash outflow, which completes the rule as written; Lab 7 implemented repayment only. | Payment-form transactions with a Cash source, transfers, receive-form `TRANSFER` lines from a Cash account, loans given, lowered opening balances, and transaction edits and deletes. Card overpayment stays allowed. | AC-51, AC-57, AC-64, AC-68–AC-72, AC-78, AC-80. See [Sprint 2 contracts](sprints/sprint-2/README.md) §4. |
| BR-13 (proposed) | A Cash, Loan Given or Loan Taken account can be archived only when its balance is exactly 0.00. | F-08 account management | AC-45, AC-46 |
| BR-14 (proposed) | A repayment received for a loan given must not exceed that loan's outstanding balance. | F-10, re-checked by F-13 | AC-56 |

The balance used by BR-12, BR-13 and BR-14 is the Sprint 2 calculation D-10 ([Sprint 2 contracts](sprints/sprint-2/README.md) §3). It counts allocation lines that move money into or out of Cash and loan accounts, and gives the same results as Sprint 1 for Sprint 1 data.

BR-13 and BR-14 are new product rules defined while writing the Sprint 2 contracts. Before the contracts PR merges, check them against BR-01 to BR-11 in the Deliverable 1 SRS.

## Change log

| Date | Change | Reason | Approval evidence |
|---|---|---|---|
| 2026-11-24 | Added BR-12 for repayment and linked AC-37–AC-40 and TEST-28–TEST-32. | The approved Lab 7 change request rejects repayments that would overdraw the source bank account. | TA Supachok Deetaweesukh; approval evidence attached to Issue [#62](https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System/issues/62). |
| 2026-11-25 | BR-12 applied to every Cash outflow. BR-13 (archive only at zero balance) and BR-14 (no over-repayment of a loan given) proposed. | Sprint 2 contracts (F-08–F-14) need one consistent overdraft rule, and the new account and loan workflows need these rules. | Team decision in [delivery2.md](delivery2.md) D-3; recorded in Issue #73. |
