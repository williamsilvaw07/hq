// Use NEXT_PUBLIC_API_URL in browser so we hit the backend directly (avoids proxy/rewrite issues). Fallback for server.
const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

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
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
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

export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
    if (!res.ok) {
      const msg =
        data.errors?.email?.[0] ??
        data.errors?.password?.[0] ??
        data.message ??
        (res.status === 422 ? "Invalid email or password. Use the exact password from the seed (e.g. password)." : `Login failed (${res.status})`);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && (err.message === "Load failed" || err.message === "Failed to fetch")) {
      throw new Error("Cannot reach the API. Is the backend running? (e.g. npm run dev in backend or ./run.sh)");
    }
    throw err;
  }
}

export async function register(name: string, email: string, password: string, password_confirmation: string) {
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || "Registration failed");
    return data;
  } catch (err) {
    if (err instanceof TypeError && (err.message === "Load failed" || err.message === "Failed to fetch")) {
      throw new Error("Cannot reach the API. Is the backend running? (e.g. npm run dev in backend or ./run.sh)");
    }
    throw err;
  }
}
