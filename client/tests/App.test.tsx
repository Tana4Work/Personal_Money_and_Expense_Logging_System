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
    expect(await screen.findByText("Bank Account")).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][0]).toBe("/api/accounts");
    await user.type(screen.getByLabelText("Opening balance amount"), "1250.5");
    fireEvent.change(screen.getByLabelText("Opening balance date"), { target: { value: "2026-11-03" } });
    await user.click(screen.getByRole("button", { name: "Save balance" }));
    await waitFor(() => expect(screen.getByText("1250.5")).toBeInTheDocument());
    expect(screen.getByText("2026-11-03")).toBeInTheDocument();
    expect(fetchMock.mock.calls[3][0]).toBe("/api/accounts/1/opening-balance");
    expect(JSON.parse((fetchMock.mock.calls[3][1] as RequestInit).body as string)).toEqual({ amount: "1250.5", date: "2026-11-03" });
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[4][0]).toBe("/api/auth/logout");
    expect(new Headers((fetchMock.mock.calls[4][1] as RequestInit).headers).get("Authorization")).toBe("Bearer user-session");
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
});
