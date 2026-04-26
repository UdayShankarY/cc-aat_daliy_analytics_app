export type ApiUser = { id: string; email: string; name: string };
export type ApiEntryType = "expense" | "sleep" | "study" | "exercise";
export type ApiEntry = {
  id: string;
  userId: string;
  type: ApiEntryType;
  amount: number;
  category: string | null;
  note: string | null;
  entryDate: string;
  createdAt: string;
};

const TOKEN_KEY = "pulse_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

function baseUrl() {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") || "http://localhost:8787";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export const api = {
  async register(input: { email: string; password: string; name: string }) {
    return request<{ token: string; user: ApiUser }>("/auth/register", { method: "POST", body: JSON.stringify(input) });
  },
  async login(input: { email: string; password: string }) {
    return request<{ token: string; user: ApiUser }>("/auth/login", { method: "POST", body: JSON.stringify(input) });
  },
  async me() {
    return request<{ user: ApiUser }>("/auth/me");
  },
  async listEntries(input: { since?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (input.since) qs.set("since", input.since);
    if (input.limit) qs.set("limit", String(input.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ entries: ApiEntry[] }>(`/entries${suffix}`);
  },
  async createEntry(input: { type: ApiEntryType; amount: number; category: string | null; note: string | null; entryDate: string }) {
    return request<{ entry: ApiEntry }>("/entries", { method: "POST", body: JSON.stringify(input) });
  },
};

