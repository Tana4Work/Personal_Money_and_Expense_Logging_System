export type Role = "USER" | "ADMINISTRATOR";
export type SafeUser = { id: number; name: string; email: string; role: Role };
export type AdminUser = { id: number; name: string; email: string; role: Role; enabled: boolean; createdAt: string };
export type Account = { id: number; name: string; type: "CASH" | "LOAN_GIVEN" | "LOAN_TAKEN" | "INCOME" | "EXPENSE"; subtype: "BANK" | "WALLET" | "CREDIT_CARD" | "OTHER"; openingBalance: string; openingBalanceDate: string | null; createdAt: string };
export type TransactionAllocation = { id: number; allocationType: "INCOME" | "EXPENSE" | "REPAYMENT" | "LOAN_GIVEN" | "BORROWING" | "TRANSFER"; amount: string; account: Pick<Account, "id" | "name" | "type" | "subtype"> };
export type MoneyTransaction = { id: number; formType: "PAYMENT_OR_CHARGE" | "RECEIVE_MONEY"; totalAmount: string; transactionDate: string; createdAt: string; sourceAccount: Pick<Account, "id" | "name" | "type" | "subtype"> | null; receivingAccount: Pick<Account, "id" | "name" | "type" | "subtype"> | null; allocations: TransactionAllocation[] };
export type FinancialSummary = { income: string; expenses: string };
export type AccountBalances = { accounts: Array<{ accountId: number; balance: string }> };
const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "The request could not be completed.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<{ token: string; expiresAt: string; user: SafeUser }>("/api/auth/login", undefined, { method: "POST", body: JSON.stringify({ email, password }) });
}
export function logout(token: string) { return request<void>("/api/auth/logout", token, { method: "POST" }); }
export function getCurrentUser(token: string) { return request<{ user: SafeUser }>("/api/auth/me", token); }
export function getAccounts(token: string) { return request<Account[]>("/api/accounts", token); }
export function recordOpeningBalance(token: string, accountId: number, amount: string, date: string) {
  return request<Account>(`/api/accounts/${accountId}/opening-balance`, token, { method: "POST", body: JSON.stringify({ amount, date }) });
}
export function recordReceivedMoney(token: string, totalAmount: string, date: string, receivingAccountId: number, incomeAccountId: number) {
  return request<MoneyTransaction>("/api/transactions/receive", token, { method: "POST", body: JSON.stringify({ totalAmount, date, receivingAccountId, allocations: [{ accountId: incomeAccountId, allocationType: "INCOME", amount: totalAmount }] }) });
}
export function recordPayment(token: string, totalAmount: string, date: string, sourceAccountId: number, allocations: Array<{ accountId: number; amount: string }>) {
  return request<MoneyTransaction>("/api/transactions/payment", token, { method: "POST", body: JSON.stringify({ totalAmount, date, sourceAccountId, allocations: allocations.map((allocation) => ({ ...allocation, allocationType: "EXPENSE" })) }) });
}
export function recordRepayment(token: string, totalAmount: string, date: string, sourceAccountId: number, receivingAccountId: number) {
  return request<MoneyTransaction>("/api/transactions/repayment", token, { method: "POST", body: JSON.stringify({ totalAmount, date, sourceAccountId, receivingAccountId }) });
}
export function getTransactions(token: string) { return request<MoneyTransaction[]>("/api/transactions", token); }
export function getFinancialSummary(token: string) { return request<FinancialSummary>("/api/summaries", token); }
export function getAccountBalances(token: string) { return request<AccountBalances>("/api/summaries/balances", token); }
export function getAdminUsers(token: string) { return request<AdminUser[]>("/api/admin/users", token); }
export function setUserEnabled(token: string, userId: number, enabled: boolean) {
  return request<AdminUser>(`/api/admin/users/${userId}/status`, token, { method: "PATCH", body: JSON.stringify({ enabled }) });
}
