const isBrowser = typeof window !== "undefined";

function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Same-origin: API routes are Next.js route handlers under /api.
  return "";
}

export function buildApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function buildMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base}${normalizedPath}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; message?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const url = buildApiUrl(path);
  const res = await fetch(url, { ...options, headers });
  const json = (await res.json().catch(() => ({}))) as {
    message?: string;
    errors?: Record<string, string[]>;
  };
  if (!res.ok) {
    const firstError =
      json.errors &&
      Object.values(json.errors).flat().find(Boolean);
    throw new Error(
      firstError || json.message || res.statusText || "Request failed"
    );
  }
  return json;
}

export type LoginResponse = { token: string; user: { id: number; name: string; email: string; avatar_url?: string | null } };

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch(buildApiUrl("/api/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({})) as LoginResponse & { message?: string; errors?: Record<string, string[]> };
    if (!res.ok) {
      const msg =
        data.errors?.email?.[0] ??
        data.errors?.password?.[0] ??
        data.message ??
        (res.status === 422 ? "Invalid email or password. Use the exact password from the seed (e.g. password)." : `Login failed (${res.status})`);
      throw new Error(msg);
    }
    return data as LoginResponse;
  } catch (err) {
    if (err instanceof TypeError && (err.message === "Load failed" || err.message === "Failed to fetch")) {
      throw new Error("Cannot reach the API. Is the app running? (e.g. npm run dev in frontend)");
    }
    throw err;
  }
}

export async function register(name: string, email: string, password: string, password_confirmation: string): Promise<LoginResponse> {
  try {
    const res = await fetch(buildApiUrl("/api/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    const data = await res.json().catch(() => ({})) as LoginResponse & { message?: string };
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data as LoginResponse;
  } catch (err) {
    if (err instanceof TypeError && (err.message === "Load failed" || err.message === "Failed to fetch")) {
      throw new Error("Cannot reach the API. Is the app running? (e.g. npm run dev in frontend)");
    }
    throw err;
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(buildApiUrl("/api/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message || "Request failed");
  return { message: data.message ?? "If that email is registered, we sent a password reset link." };
}

export async function resetPassword(
  token: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<{ message: string }> {
  const res = await fetch(buildApiUrl("/api/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token, email, password, password_confirmation }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message || "Reset failed");
  return { message: data.message ?? "Password has been reset." };
}
