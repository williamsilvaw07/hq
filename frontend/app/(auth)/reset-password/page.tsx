"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validToken = token.length > 0;

  useEffect(() => {
    setEmail(emailParam);
  }, [emailParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset link. Request a new one.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, email, password, passwordConfirmation);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!validToken) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          This link is invalid or missing. Please request a new password reset
          from the sign-in page.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold text-sm"
        >
          Request reset link
        </Link>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  if (success) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Password reset
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Your password has been reset. You can sign in with your new password.
        </p>
        <Link
          href="/login"
          className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold text-sm"
        >
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        Set new password
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-2xl p-3">
            {error}
          </p>
        )}
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
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="label block mb-2">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password_confirmation" className="label block mb-2">
            Confirm new password
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold text-sm shadow-lg shadow-white/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading…</p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
