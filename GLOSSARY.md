# Project Glossary

## User

A person who owns and manages private financial accounts and transactions.

## Administrator

A platform operator who can manage user access, including enabling or disabling users. An Administrator does not automatically receive access to users' financial records or summaries.

## Account

A user-owned financial category or balance-holding record. Account types are Cash, Loan Given, Loan Taken, Income, and Expense.

## Cash account

An account representing money held by the user, such as a bank account or wallet.

## Loan Taken account

An account representing money the user owes, such as a credit card or other borrowed money.

## Loan Given account

An account representing money another person owes to the user.

## Income account

An account used to categorize money received, such as salary or interest earned.

## Expense account

An account used to categorize spending, such as dining, groceries, electricity, or telecom.

## Transaction

A persisted financial event that records either receiving money or making a payment/charge. A transaction has a total amount and one or more allocation lines.

## Allocation line

A portion of a transaction total assigned to an income, expense, repayment, loan, or transfer destination. The sum of allocation lines must equal the transaction total.

## Opening balance

The initial balance recorded for an account at the beginning of the user's tracking history. It is not income or expense.

## Payment or charge

A transaction form that uses a cash, bank, credit-card, or loan-taken account as the source and allocates the total to one or more destinations.

## Receive money

A transaction form that deposits money into a cash or bank account and allocates the total to income, loan repayment, borrowing, or transfer categories.

## Repayment

A transaction that reduces a liability such as credit-card debt. A repayment is not income or expense.

## Overdraft

A Cash account balance below zero. BR-12 prohibits any Cash outflow from creating an overdraft, and a balance of exactly zero is allowed. Lab 7 enforced it for repayment only. Sprint 2 enforces it for every Cash outflow, including transfers, loans given, opening-balance changes and corrections.

## Ownership

The relationship between a User and that user's financial records. Backend authorization must use the authenticated identity to enforce ownership.

## Transfer

Moving money between two of the same user's Cash accounts, for example from the bank to the wallet. It is stored as a payment-form transaction with a `TRANSFER` allocation line, and it is neither income nor expense.

## Loan given

Money the user lent to someone, tracked in a `LOAN_GIVEN` account. Its balance is the amount still owed to the user. It rises when the user lends and falls when a repayment is received.

## Borrowing

Money the user receives as a loan, recorded on the receive form with a `BORROWING` line from a `LOAN_TAKEN` account. It increases the user's debt.

## Archive

Hiding an account the user no longer uses. An archived account cannot be used in new transactions but stays in history, balances and summaries, and can be restored. Under BR-13, a Cash or loan account can be archived only at a zero balance.

## Correction

Editing or deleting one of the user's own transactions (F-13). Every rule that applies on creation is re-checked, and balances are recalculated from the corrected data.
