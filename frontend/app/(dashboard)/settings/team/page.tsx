"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  UserPlus,
  Mail,
  ChevronRight,
  Trash2,
  Copy,
  Users,
  User,
} from "lucide-react";

type Member = { id: number; user_id: number; role: string; name: string; email: string };
type Invitation = { id: number; email: string; role: string; expires_at: string; invited_by?: { name: string; email: string } };

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access, can delete workspace",
  admin: "Can invite and manage members, edit workspace",
  member: "Can add and edit transactions, view all",
  viewer: "Read-only access",
};

export default function TeamPage() {
  const { user, workspaceId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      api<{ data: Member[] }>(`/api/workspaces/${workspaceId}/members`).then((r) => setMembers(r.data ?? [])).catch(() => {}),
      api<{ data: Invitation[] }>(`/api/workspaces/${workspaceId}/invitations`).then((r) => setInvitations(r.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [workspaceId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    setInviteLink("");
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await api<{ data: { invite_link: string } }>(`/api/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          frontend_url: base,
        }),
      });
      if (res.data?.invite_link) {
        setInviteLink(res.data.invite_link);
        setInviteEmail("");
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/invitations/${id}`, { method: "DELETE" });
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  }

  async function updateMemberRole(memberUserId: number, role: string) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/members/${memberUserId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setMembers((prev) => prev.map((m) => (m.user_id === memberUserId ? { ...m, role } : m)));
    } catch {}
  }

  async function removeMember(memberUserId: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/members/${memberUserId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
    } catch {}
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const currentUserRole = members.find((m) => m.user_id === user?.id)?.role ?? "member";
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  if (loading) {
    return <div className="text-muted-foreground text-sm py-8">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 font-sans tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link
          href="/settings"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Link>
        <h1 className="text-lg font-bold">Workspace team</h1>
        <div className="w-10" />
      </header>
      <main className="px-6 space-y-8 pt-6">
        {canManage && (
          <section className="space-y-4">
            <h2 className="section-title px-1">Invite by email</h2>
            <form onSubmit={handleInvite} className="card-base p-4 space-y-4">
              <div>
                <label className="label block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full bg-card rounded-2xl border border-border pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label block mb-2">Access level</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
                  className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                >
                  <option value="viewer">Viewer – read-only</option>
                  <option value="member">Member – can add/edit transactions</option>
                  <option value="admin">Admin – can manage members and settings</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[inviteRole]}</p>
              </div>
              {inviteError && <p className="text-sm text-chart-2">{inviteError}</p>}
              {inviteLink && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl">
                  <input readOnly value={inviteLink} className="flex-1 bg-transparent text-xs text-muted-foreground truncate" />
                  <button type="button" onClick={copyLink} className="shrink-0 p-2 rounded-lg bg-card border border-border text-foreground">
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-xs text-chart-1">Copied!</span>}
                </div>
              )}
              <button
                type="submit"
                disabled={inviting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {inviting ? "Sending…" : "Send invite"}
              </button>
            </form>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="section-title px-1">Members ({members.length})</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 bg-card rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{m.name || m.email}</p>
                    <p className="text-[10px] text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && m.role !== "owner" && m.user_id !== user?.id ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(m.user_id, e.target.value)}
                        className="text-xs font-bold bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMember(m.user_id)}
                        className="p-2 rounded-lg text-chart-2 hover:bg-chart-2/10"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase">{ROLE_LABELS[m.role]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {canManage && invitations.length > 0 && (
          <section className="space-y-4">
            <h2 className="section-title px-1">Pending invites</h2>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{inv.email}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[inv.role]} · Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeInvite(inv.id)}
                    className="p-2 rounded-lg text-chart-2 hover:bg-chart-2/10"
                    aria-label="Revoke"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
