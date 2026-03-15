"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, passwordConfirmation, returnTo || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-2xl p-3">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="name" className="label block mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl sm:rounded-2xl border border-border/50 bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="email" className="label block mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl sm:rounded-2xl border border-border/50 bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="label block mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl sm:rounded-2xl border border-border/50 bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password_confirmation" className="label block mb-2">
            Confirm password
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            className="w-full rounded-xl sm:rounded-2xl border border-border/50 bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl sm:rounded-2xl bg-primary text-primary-foreground py-2.5 sm:py-3 font-bold text-sm shadow-lg shadow-white/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
