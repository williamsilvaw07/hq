"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccess(true);
      if (data.message) setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
        Forgot password
      </h1>
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If that email is registered, we sent a password reset link. Check your
            inbox and spam folder.
          </p>
          <Link
            href="/login"
            className="block w-full text-center rounded-xl sm:rounded-2xl bg-primary text-primary-foreground py-2.5 sm:py-3 font-bold text-sm"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
              className="w-full rounded-xl sm:rounded-2xl border border-border/50 bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl sm:rounded-2xl bg-primary text-primary-foreground py-2.5 sm:py-3 font-bold text-sm shadow-lg shadow-white/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
