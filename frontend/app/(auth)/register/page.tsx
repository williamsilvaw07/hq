"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function RegisterContent() {
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
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="text-xs text-muted-foreground/50 mt-1">Start tracking your finances</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-xl p-3">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs sm:text-[13px] font-medium text-muted-foreground/60 uppercase tracking-wider ml-1">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
            className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs sm:text-[13px] font-medium text-muted-foreground/60 uppercase tracking-wider ml-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs sm:text-[13px] font-medium text-muted-foreground/60 uppercase tracking-wider ml-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password_confirmation" className="text-xs sm:text-[13px] font-medium text-muted-foreground/60 uppercase tracking-wider ml-1">Confirm Password</label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white text-black py-3 font-bold text-sm hover:bg-white/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-white/5"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground/40">
        Already have an account?{" "}
        <Link href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="text-foreground font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
