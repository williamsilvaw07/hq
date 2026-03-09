"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";

type InviteInfo = { workspace_name: string; email: string; role: string };

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(buildApiUrl(`/api/invitations/accept?token=${encodeURIComponent(token)}`), {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setInfo(data.data);
        else setError(data.message || "Invalid or expired link");
      })
      .catch(() => setError("Could not load invitation"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!token || !user) return;
    setAccepting(true);
    setError("");
    try {
      const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(buildApiUrl("/api/invitations/accept"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.errors?.token?.[0] || "Failed to accept");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setAccepting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card-base p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Invalid link</h1>
          <p className="text-sm text-muted-foreground mb-4">This invite link is missing or invalid.</p>
          <Link href="/login" className="text-primary font-bold text-sm hover:underline">Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card-base p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Invitation invalid</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Link href="/login" className="text-primary font-bold text-sm hover:underline">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card-base p-8 max-w-sm w-full space-y-6">
        <h1 className="text-xl font-bold text-foreground">Workspace invitation</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited to join <strong className="text-foreground">{info?.workspace_name ?? "a workspace"}</strong> as <strong className="text-foreground">{info?.role ?? "member"}</strong>.
        </p>
        {error && <p className="text-sm text-chart-2">{error}</p>}
        {user ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {accepting ? "Accepting…" : "Accept invitation"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Sign in or register to accept this invitation.</p>
            <Link
              href={`/login?returnTo=${encodeURIComponent("/invite/accept?token=" + token)}`}
              className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm text-center"
            >
              Sign in
            </Link>
            <Link
              href={`/register?returnTo=${encodeURIComponent("/invite/accept?token=" + token)}`}
              className="block w-full py-3 rounded-xl border border-border text-foreground font-bold text-sm text-center"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-6"><div className="text-muted-foreground text-sm">Loading…</div></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
