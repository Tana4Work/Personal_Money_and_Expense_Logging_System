import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.js";

function response(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: async () => body } as Response);
}

describe("authentication and account UI", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("logs in, saves an opening bank balance and date, and logs out", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ token: "user-session", expiresAt: "2030-01-01T00:00:00.000Z", user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response({ user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response([{ id: 1, name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" }]))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "0", expenses: "0" }))
      .mockImplementationOnce(() => response([]))
      .mockImplementationOnce(() => response({ id: 1, name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "1250.5", openingBalanceDate: "2026-11-03T00:00:00.000Z", createdAt: "2026-11-03T00:00:00.000Z" }))
      .mockImplementationOnce(() => response({}, 204));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "demo.user@money.local");
    await user.type(screen.getByLabelText("Password"), "A synthetic password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Welcome, Demo User" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/me");
    expect(await screen.findByRole("cell", { name: "Bank Account" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][0]).toBe("/api/accounts");
    await user.type(screen.getByLabelText("Opening balance amount"), "1250.5");
    fireEvent.change(screen.getByLabelText("Opening balance date"), { target: { value: "2026-11-03" } });
    await user.click(screen.getByRole("button", { name: "Save balance" }));
    await waitFor(() => expect(screen.getAllByText("1250.5").length).toBeGreaterThan(0));
    expect(screen.getByText("2026-11-03")).toBeInTheDocument();
    expect(fetchMock.mock.calls[6][0]).toBe("/api/accounts/1/opening-balance");
    expect(JSON.parse((fetchMock.mock.calls[6][1] as RequestInit).body as string)).toEqual({ amount: "1250.5", date: "2026-11-03" });
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[7][0]).toBe("/api/auth/logout");
    expect(new Headers((fetchMock.mock.calls[7][1] as RequestInit).headers).get("Authorization")).toBe("Bearer user-session");
  });

  it("records received salary and refreshes financial history", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ token: "user-session", expiresAt: "2030-01-01T00:00:00.000Z", user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response({ user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response([
        { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
        { id: 2, name: "Salary", type: "INCOME", subtype: "OTHER", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
      ]))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "0" }, { accountId: 2, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "0", expenses: "0" }))
      .mockImplementationOnce(() => response([]))
      .mockImplementationOnce(() => response({ id: 10, formType: "RECEIVE_MONEY", totalAmount: "30000", transactionDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-04T00:00:00.000Z", receivingAccount: { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK" }, allocations: [{ id: 1, allocationType: "INCOME", amount: "30000", account: { id: 2, name: "Salary", type: "INCOME", subtype: "OTHER" } }] }))
      .mockImplementationOnce(() => response([
        { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
        { id: 2, name: "Salary", type: "INCOME", subtype: "OTHER", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
      ]))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "30000" }, { accountId: 2, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "30000", expenses: "0" }))
      .mockImplementationOnce(() => response([{ id: 10, formType: "RECEIVE_MONEY", totalAmount: "30000", transactionDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-04T00:00:00.000Z", receivingAccount: { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK" }, allocations: [{ id: 1, allocationType: "INCOME", amount: "30000", account: { id: 2, name: "Salary", type: "INCOME", subtype: "OTHER" } }] }]))
      .mockImplementationOnce(() => response({}, 204));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "demo.user@money.local");
    await user.type(screen.getByLabelText("Password"), "A synthetic password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.type(await screen.findByLabelText("Amount"), "30000");
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-11-04" } });
    await user.selectOptions(screen.getByLabelText("Receiving account"), "1");
    await user.selectOptions(screen.getByLabelText("Income category"), "2");
    await user.click(screen.getByRole("button", { name: "Record received money" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Money received successfully."));
    expect(fetchMock.mock.calls[6][0]).toBe("/api/transactions/receive");
    expect(JSON.parse((fetchMock.mock.calls[6][1] as RequestInit).body as string)).toEqual({ totalAmount: "30000", date: "2026-11-04", receivingAccountId: 1, allocations: [{ accountId: 2, allocationType: "INCOME", amount: "30000" }] });
    expect(screen.getAllByText("30000").length).toBeGreaterThan(0);
    expect(screen.getByText("Received money")).toBeInTheDocument();
  });

  it("records a split credit-card purchase and refreshes expense history", async () => {
    const accounts = [
      { id: 1, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
      { id: 2, name: "Dining", type: "EXPENSE", subtype: "OTHER", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
      { id: 3, name: "Groceries", type: "EXPENSE", subtype: "OTHER", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
    ];
    const transaction = { id: 20, formType: "PAYMENT_OR_CHARGE", totalAmount: "2000", transactionDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-04T00:00:00.000Z", sourceAccount: { id: 1, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" }, receivingAccount: null, allocations: [{ id: 1, allocationType: "EXPENSE", amount: "800", account: { id: 2, name: "Dining", type: "EXPENSE", subtype: "OTHER" } }, { id: 2, allocationType: "EXPENSE", amount: "1200", account: { id: 3, name: "Groceries", type: "EXPENSE", subtype: "OTHER" } }] };
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ token: "user-session", expiresAt: "2030-01-01T00:00:00.000Z", user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response({ user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response(accounts))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "0" }, { accountId: 2, balance: "0" }, { accountId: 3, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "0", expenses: "0" }))
      .mockImplementationOnce(() => response([]))
      .mockImplementationOnce(() => response(transaction))
      .mockImplementationOnce(() => response(accounts))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "-2000" }, { accountId: 2, balance: "0" }, { accountId: 3, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "0", expenses: "2000" }))
      .mockImplementationOnce(() => response([transaction]));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "demo.user@money.local");
    await user.type(screen.getByLabelText("Password"), "A synthetic password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.type(await screen.findByLabelText("Payment total amount"), "2000");
    fireEvent.change(screen.getByLabelText("Payment date"), { target: { value: "2026-11-04" } });
    await user.selectOptions(screen.getByLabelText("Credit card"), "1");
    await user.type(screen.getByLabelText("Dining allocation"), "800");
    await user.type(screen.getByLabelText("Groceries allocation"), "1200");
    await user.click(screen.getByRole("button", { name: "Record card purchase" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Payment recorded successfully."));
    expect(fetchMock.mock.calls[6][0]).toBe("/api/transactions/payment");
    expect(JSON.parse((fetchMock.mock.calls[6][1] as RequestInit).body as string)).toEqual({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: 1, allocations: [{ accountId: 2, amount: "800", allocationType: "EXPENSE" }, { accountId: 3, amount: "1200", allocationType: "EXPENSE" }] });
    expect(screen.getByText("Payment/charge")).toBeInTheDocument();
  });

  it("records a credit-card repayment and refreshes the overview", async () => {
    const accounts = [
      { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK", openingBalance: "10000", openingBalanceDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-03T00:00:00.000Z" },
      { id: 2, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD", openingBalance: "0", openingBalanceDate: null, createdAt: "2026-11-03T00:00:00.000Z" },
    ];
    const purchase = { id: 20, formType: "PAYMENT_OR_CHARGE", totalAmount: "2000", transactionDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-04T00:00:00.000Z", sourceAccount: { id: 2, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" }, receivingAccount: null, allocations: [{ id: 1, allocationType: "EXPENSE", amount: "2000", account: { id: 3, name: "Dining", type: "EXPENSE", subtype: "OTHER" } }] };
    const repayment = { id: 21, formType: "PAYMENT_OR_CHARGE", totalAmount: "2000", transactionDate: "2026-11-04T00:00:00.000Z", createdAt: "2026-11-04T00:00:00.000Z", sourceAccount: { id: 1, name: "Bank Account", type: "CASH", subtype: "BANK" }, receivingAccount: { id: 2, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" }, allocations: [{ id: 2, allocationType: "REPAYMENT", amount: "2000", account: { id: 2, name: "Credit Card", type: "LOAN_TAKEN", subtype: "CREDIT_CARD" } }] };
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ token: "user-session", expiresAt: "2030-01-01T00:00:00.000Z", user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response({ user: { id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER" } }))
      .mockImplementationOnce(() => response(accounts))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "40000" }, { accountId: 2, balance: "-2000" }] }))
      .mockImplementationOnce(() => response({ income: "30000", expenses: "2000" }))
      .mockImplementationOnce(() => response([purchase]))
      .mockImplementationOnce(() => response(repayment))
      .mockImplementationOnce(() => response(accounts))
      .mockImplementationOnce(() => response({ accounts: [{ accountId: 1, balance: "38000" }, { accountId: 2, balance: "0" }] }))
      .mockImplementationOnce(() => response({ income: "30000", expenses: "2000" }))
      .mockImplementationOnce(() => response([purchase, repayment]));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "demo.user@money.local");
    await user.type(screen.getByLabelText("Password"), "A synthetic password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.type(await screen.findByLabelText("Repayment amount"), "2000");
    fireEvent.change(screen.getByLabelText("Repayment date"), { target: { value: "2026-11-04" } });
    await user.selectOptions(screen.getByLabelText("Bank source account"), "1");
    await user.selectOptions(screen.getByLabelText("Credit-card destination"), "2");
    await user.click(screen.getByRole("button", { name: "Record repayment" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Repayment recorded successfully."));
    expect(fetchMock.mock.calls[6][0]).toBe("/api/transactions/repayment");
    expect(JSON.parse((fetchMock.mock.calls[6][1] as RequestInit).body as string)).toEqual({ totalAmount: "2000", date: "2026-11-04", sourceAccountId: 1, receivingAccountId: 2 });
    expect(screen.getByText("Credit-card debt")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("shows administrator access controls without loading financial accounts", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ token: "admin-session", expiresAt: "2030-01-01T00:00:00.000Z", user: { id: 2, name: "Demo Administrator", email: "demo.admin@money.local", role: "ADMINISTRATOR" } }))
      .mockImplementationOnce(() => response({ user: { id: 2, name: "Demo Administrator", email: "demo.admin@money.local", role: "ADMINISTRATOR" } }))
      .mockImplementationOnce(() => response([{ id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER", enabled: true, createdAt: "2026-11-02T00:00:00.000Z" }]))
      .mockImplementationOnce(() => response({ id: 1, name: "Demo User", email: "demo.user@money.local", role: "USER", enabled: false, createdAt: "2026-11-02T00:00:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "demo.admin@money.local");
    await user.type(screen.getByLabelText("Password"), "A synthetic password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "User administration" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/me");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/admin/users");
    expect(screen.queryByText("Bank Account")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Disable Demo User" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[3][0]).toBe("/api/admin/users/1/status");
  });

  it("registers a normal user and returns to sign in with a notification", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(() => response({ user: { id: 7, name: "New User", email: "new.user@test.local", role: "USER" } }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create a new account" }));
    await user.type(screen.getByLabelText("Name"), "New User");
    await user.type(screen.getByLabelText("Email address"), "new.user@test.local");
    await user.type(screen.getByLabelText("Password"), "Register!1");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Account created successfully. Please sign in."));
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/register");
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ name: "New User", email: "new.user@test.local", password: "Register!1" });
  });
});
