import { useEffect, useState, type FormEvent } from "react";
import { getAccounts, getAdminUsers, getCurrentUser, login, logout, recordOpeningBalance, setUserEnabled, type Account, type AdminUser, type SafeUser } from "./api.js";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    setError("");
    if (user.role === "ADMINISTRATOR") void getAdminUsers(token).then(setUsers).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load your workspace."));
    else void getAccounts(token).then(setAccounts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load your accounts."));
  }, [token, user]);

  async function signIn(email: string, password: string) {
    setBusy(true); setError("");
    try { const result = await login(email, password); const identity = await getCurrentUser(result.token); setToken(result.token); setUser(identity.user); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    const currentToken = token;
    setBusy(true);
    try { if (currentToken) await logout(currentToken); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign out."); }
    finally { setToken(null); setUser(null); setAccounts([]); setUsers([]); setBusy(false); }
  }

  async function changeEnabled(target: AdminUser) {
    if (!token) return;
    const updated = await setUserEnabled(token, target.id, !target.enabled);
    setUsers((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
  }

  async function saveOpeningBalance(accountId: number, amount: string, date: string) {
    if (!token) return;
    const updated = await recordOpeningBalance(token, accountId, amount, date);
    setAccounts((current) => current.map((account) => account.id === updated.id ? updated : account));
  }

  if (!user || !token) return <LoginScreen busy={busy} error={error} onSubmit={signIn} />;
  return <div className="app-shell">
    <header className="topbar"><div className="container d-flex justify-content-between align-items-center py-3"><a className="brand" href="#home">Personal Money</a><div className="d-flex align-items-center gap-3"><span className="user-label">{user.name} <span className="role-pill">{user.role}</span></span><button className="btn btn-outline-light btn-sm" type="button" disabled={busy} onClick={() => void signOut()}>Log out</button></div></div></header>
    <main className="container py-4" id="home">
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {user.role === "USER" ? <UserHome user={user} accounts={accounts} onSaveOpeningBalance={saveOpeningBalance} /> : <AdminView users={users} onChange={changeEnabled} />}
    </main>
  </div>;
}

function LoginScreen({ busy, error, onSubmit }: { busy: boolean; error: string; onSubmit: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <p className="eyebrow">PERSONAL FINANCE</p><h1 id="login-title">Welcome back</h1><p className="text-secondary">Sign in to view your financial accounts.</p>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <form onSubmit={(event) => { event.preventDefault(); void onSubmit(email, password); }}>
        <label className="form-label" htmlFor="email">Email address</label><input className="form-control mb-3" id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label className="form-label" htmlFor="password">Password</label><input className="form-control" id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="btn btn-primary w-100 mt-4" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </section>
  </main>;
}

function UserHome({ user, accounts, onSaveOpeningBalance }: { user: SafeUser; accounts: Account[]; onSaveOpeningBalance: (accountId: number, amount: string, date: string) => Promise<void> }) {
  return <section aria-labelledby="welcome-heading"><p className="eyebrow">PERSONAL FINANCE</p><h1 id="welcome-heading">Welcome, {user.name}</h1><p className="text-secondary">Your financial workspace is ready.</p>
    <section aria-labelledby="accounts-heading"><h2 className="h4 mt-4" id="accounts-heading">Your accounts</h2><div className="table-responsive admin-table"><table className="table align-middle"><thead><tr><th>Name</th><th>Type</th><th>Subtype</th><th>Opening balance</th><th>As of date</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td>{account.name}</td><td>{account.type}</td><td>{account.subtype}</td><td>{account.openingBalance}</td><td>{account.openingBalanceDate?.slice(0, 10) ?? "Not recorded"}</td></tr>)}</tbody></table></div></section>
    {accounts.filter((account) => account.type === "CASH" && account.subtype === "BANK").map((account) => <OpeningBalanceForm key={account.id} account={account} onSave={onSaveOpeningBalance} />)}
  </section>;
}

function OpeningBalanceForm({ account, onSave }: { account: Account; onSave: (accountId: number, amount: string, date: string) => Promise<void> }) {
  const [amount, setAmount] = useState(account.openingBalanceDate ? account.openingBalance : "");
  const [date, setDate] = useState(account.openingBalanceDate?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSave(account.id, amount, date); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the opening balance."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby={`opening-balance-heading-${account.id}`} className="mt-4">
    <h2 className="h4" id={`opening-balance-heading-${account.id}`}>Opening balance for {account.name}</h2>
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    <form className="row g-3" onSubmit={(event) => void submit(event)}>
      <div className="col-sm-5"><label className="form-label" htmlFor={`opening-amount-${account.id}`}>Opening balance amount</label><input className="form-control" id={`opening-amount-${account.id}`} type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
      <div className="col-sm-5"><label className="form-label" htmlFor={`opening-date-${account.id}`}>Opening balance date</label><input className="form-control" id={`opening-date-${account.id}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
      <div className="col-sm-2 d-flex align-items-end"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save balance"}</button></div>
    </form>
  </section>;
}

function AdminView({ users, onChange }: { users: AdminUser[]; onChange: (user: AdminUser) => Promise<void> }) {
  const [error, setError] = useState(""); const [busyId, setBusyId] = useState<number | null>(null);
  async function toggle(user: AdminUser) {
    setBusyId(user.id); setError("");
    try { await onChange(user); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to change user status."); }
    finally { setBusyId(null); }
  }
  return <section aria-labelledby="admin-heading"><p className="eyebrow">ACCESS CONTROL</p><h1 id="admin-heading">User administration</h1><p className="text-secondary">Manage platform access. Financial accounts are not available to administrators.</p>
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    <div className="table-responsive admin-table"><table className="table align-middle"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th><span className="visually-hidden">Action</span></th></tr></thead><tbody>{users.map((target) => <tr key={target.id}><td>{target.name}</td><td>{target.email}</td><td>{target.role}</td><td><span className={`status-pill ${target.enabled ? "status-active" : "status-disabled"}`}>{target.enabled ? "Enabled" : "Disabled"}</span></td><td className="text-end"><button type="button" className={`btn btn-sm ${target.enabled ? "btn-outline-danger" : "btn-outline-success"}`} disabled={busyId === target.id} onClick={() => void toggle(target)}>{target.enabled ? "Disable" : "Enable"} {target.name}</button></td></tr>)}</tbody></table></div>
  </section>;
}
