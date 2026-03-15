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
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-xs text-muted-foreground/50 mt-1">We&apos;ll email you a reset link</p>
      </div>
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground/60 text-center">
            If that email is registered, we sent a password reset link. Check your inbox and spam folder.
          </p>
          <Link
            href="/login"
            className="block w-full text-center rounded-xl bg-white text-black py-3 font-bold text-sm hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-xl p-3">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest ml-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/[0.08] bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-3 font-bold text-sm hover:bg-white/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-white/5"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-xs text-muted-foreground/40">
        <Link href="/login" className="text-foreground font-bold hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
