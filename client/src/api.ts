export type Role = "USER" | "ADMINISTRATOR";
export type SafeUser = { id: number; name: string; email: string; role: Role };
export type AdminUser = { id: number; name: string; email: string; role: Role; enabled: boolean; createdAt: string };
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
export function getAdminUsers(token: string) { return request<AdminUser[]>("/api/admin/users", token); }
export function setUserEnabled(token: string, userId: number, enabled: boolean) {
  return request<AdminUser>(`/api/admin/users/${userId}/status`, token, { method: "PATCH", body: JSON.stringify({ enabled }) });
}
