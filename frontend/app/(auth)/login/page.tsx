"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbHealthy, setDbHealthy] = useState<null | boolean>(null);
  const [dbMessage, setDbMessage] = useState<string>("");
  const { login } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function checkDb() {
      try {
        const res = await fetch("/api/health/db");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.ok) {
          setDbHealthy(true);
          setDbMessage("Database connection OK");
        } else {
          setDbHealthy(false);
          setDbMessage(data?.error || "Database check failed");
        }
      } catch (e) {
        if (cancelled) return;
        setDbHealthy(false);
        setDbMessage("Database check failed");
      }
    }
    checkDb();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">Sign in</h1>
      {dbHealthy === false && (
        <p className="mb-4 text-xs rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
          Database error: {dbMessage}
        </p>
      )}
      {dbHealthy === true && (
        <p className="mb-4 text-xs rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-300">
          Database connection OK.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-2xl p-3">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="label block mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="label block">Password</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold text-sm shadow-lg shadow-white/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
