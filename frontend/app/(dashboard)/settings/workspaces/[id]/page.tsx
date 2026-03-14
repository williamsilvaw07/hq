"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ArrowLeft, Pencil, Trash2, UserPlus, X, Check, Crown, Shield, Eye, User,
} from "lucide-react";

type Workspace = { id: number; name: string; slug: string; currency: string };
type Member = { id: number; user_id: number; role: string; name: string; email: string };

type Sheet =
  | { type: "edit-name" }
  | { type: "currency" }
  | { type: "invite" }
  | { type: "remove-member"; member: Member }
  | { type: "change-role"; member: Member }
  | { type: "delete" };

const CURRENCIES = [
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "ARS", label: "Argentine Peso", symbol: "$" },
  { code: "CLP", label: "Chilean Peso", symbol: "$" },
  { code: "COP", label: "Colombian Peso", symbol: "$" },
  { code: "MXN", label: "Mexican Peso", symbol: "$" },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5 text-yellow-400" />,
  admin: <Shield className="w-3.5 h-3.5 text-blue-400" />,
  member: <User className="w-3.5 h-3.5 text-muted-foreground" />,
  viewer: <Eye className="w-3.5 h-3.5 text-muted-foreground" />,
};

export default function WorkspaceSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser, workspaceId: activeWorkspaceId, setWorkspaceId } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [name, setName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("BRL");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedRole, setSelectedRole] = useState("member");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Workspace>(`/api/workspaces/${id}`),
      api<Member[]>(`/api/workspaces/${id}/members`),
    ])
      .then(([wRes, mRes]) => {
        setWorkspace(wRes.data ?? null);
        setMembers(Array.isArray(mRes.data) ? mRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function openSheet(s: Sheet) {
    setError("");
    if (s.type === "edit-name") setName(workspace?.name ?? "");
    if (s.type === "currency") setSelectedCurrency(workspace?.currency ?? "BRL");
    if (s.type === "invite") { setInviteEmail(""); setInviteRole("member"); }
    if (s.type === "change-role") setSelectedRole(s.member.role);
    setSheet(s);
  }

  function closeSheet() { setSheet(null); setError(""); }

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true); setError("");
    try {
      const res = await api<Workspace>(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setWorkspace(res.data ?? workspace);
      window.dispatchEvent(new Event("workspaces-refresh"));
      closeSheet();
    } catch { setError("Failed to update."); }
    finally { setSaving(false); }
  }

  async function handleSaveCurrency(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      const res = await api<Workspace>(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ currency: selectedCurrency }),
      });
      setWorkspace(res.data ?? workspace);
      closeSheet();
    } catch { setError("Failed to update currency."); }
    finally { setSaving(false); }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${id}/members/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      closeSheet();
    } catch { setError("Failed to send invite."); }
    finally { setSaving(false); }
  }

  async function handleChangeRole(e: FormEvent) {
    e.preventDefault();
    if (sheet?.type !== "change-role" || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${id}/members/${sheet.member.user_id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: selectedRole }),
      });
      setMembers((prev) => prev.map((m) => m.user_id === sheet.member.user_id ? { ...m, role: selectedRole } : m));
      closeSheet();
    } catch { setError("Failed to change role."); }
    finally { setSaving(false); }
  }

  async function handleRemoveMember() {
    if (sheet?.type !== "remove-member" || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${id}/members/${sheet.member.user_id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.user_id !== sheet.member.user_id));
      closeSheet();
    } catch { setError("Failed to remove member."); }
    finally { setSaving(false); }
  }

  async function handleDeleteWorkspace() {
    if (saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${id}`, { method: "DELETE" });
      if (activeWorkspaceId === Number(id)) {
        const res = await api<Workspace[]>("/api/workspaces");
        const remaining = Array.isArray(res.data) ? res.data : [];
        if (remaining.length > 0) setWorkspaceId(remaining[0].id);
      }
      window.dispatchEvent(new Event("workspaces-refresh"));
      router.replace("/settings/workspaces");
    } catch { setError("Failed to delete workspace."); }
    finally { setSaving(false); }
  }

  const currencyInfo = CURRENCIES.find((c) => c.code === workspace?.currency) ?? CURRENCIES[0];
  const isActive = Number(id) === activeWorkspaceId;
  const myMember = members.find((m) => m.email === authUser?.email);
  const isOwner = myMember?.role === "owner";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between bg-background/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Workspace</p>
          <p className="text-sm font-bold truncate max-w-[160px]">{workspace.name}</p>
        </div>
        <div className="w-10" />
      </header>

      <main className="px-6 space-y-6 py-2">
        {/* Identity */}
        <section className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">General</p>
          <div className="bg-secondary rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => openSheet({ type: "edit-name" })}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors border-b border-border/30"
            >
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Name</p>
                <p className="text-sm font-bold">{workspace.name}</p>
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => openSheet({ type: "currency" })}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Currency</p>
                <p className="text-sm font-bold">{currencyInfo.code} — {currencyInfo.label}</p>
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {isActive && (
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest px-1">● Active workspace</p>
          )}
        </section>

        {/* Members */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Team Members</p>
            <button
              type="button"
              onClick={() => openSheet({ type: "invite" })}
              className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
          <div className="bg-secondary rounded-xl overflow-hidden divide-y divide-border/30">
            {members.map((m) => {
              const isMe = m.email === authUser?.email;
              const canManage = isOwner && !isMe && m.role !== "owner";
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-sm font-black text-foreground shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{m.name}{isMe && <span className="text-muted-foreground font-normal"> (you)</span>}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1">
                      {ROLE_ICONS[m.role]}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.role}</span>
                    </div>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openSheet({ type: "change-role", member: m })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSheet({ type: "remove-member", member: m })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-chart-2 hover:bg-chart-2/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Danger Zone */}
        {isOwner && (
          <section className="space-y-2">
            <p className="text-[10px] font-black text-chart-2/70 uppercase tracking-[0.2em] px-1">Danger Zone</p>
            <button
              type="button"
              onClick={() => openSheet({ type: "delete" })}
              className="w-full py-4 bg-chart-2/10 border border-chart-2/20 text-chart-2 font-bold text-sm rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Workspace
            </button>
          </section>
        )}
      </main>

      {/* Sheet overlay */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="w-full max-w-lg bg-card rounded-t-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">
                {sheet.type === "edit-name" && "Edit Name"}
                {sheet.type === "currency" && "Change Currency"}
                {sheet.type === "invite" && "Invite Member"}
                {sheet.type === "change-role" && "Change Role"}
                {sheet.type === "remove-member" && "Remove Member"}
                {sheet.type === "delete" && "Delete Workspace"}
              </p>
              <button type="button" onClick={closeSheet} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-chart-2">{error}</p>}

            {/* Edit Name */}
            {sheet.type === "edit-name" && (
              <form onSubmit={handleSaveName} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full rounded-lg bg-background border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving || !name.trim()} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}

            {/* Currency */}
            {sheet.type === "currency" && (
              <form onSubmit={handleSaveCurrency} className="space-y-4">
                <div className="space-y-1">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${selectedCurrency === c.code ? "bg-primary/10 text-primary" : "bg-background text-foreground hover:bg-white/5"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black w-8">{c.symbol}</span>
                        <div className="text-left">
                          <p className="text-xs font-bold">{c.code}</p>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                        </div>
                      </div>
                      {selectedCurrency === c.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}

            {/* Invite */}
            {sheet.type === "invite" && (
              <form onSubmit={handleInvite} className="space-y-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="w-full rounded-lg bg-background border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                <div className="bg-secondary/30 rounded-lg p-1 grid grid-cols-3 gap-1">
                  {(["member", "admin", "viewer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inviteRole === r ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving || !inviteEmail.trim()} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </form>
            )}

            {/* Change Role */}
            {sheet.type === "change-role" && (
              <form onSubmit={handleChangeRole} className="space-y-4">
                <p className="text-xs text-muted-foreground">Changing role for <span className="font-bold text-foreground">{sheet.member.name}</span></p>
                <div className="bg-secondary/30 rounded-lg p-1 grid grid-cols-3 gap-1">
                  {(["admin", "member", "viewer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === r ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}

            {/* Remove Member */}
            {sheet.type === "remove-member" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Remove <span className="font-bold text-foreground">{sheet.member.name}</span> from this workspace?
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="button" onClick={handleRemoveMember} disabled={saving} className="flex-1 py-3 rounded-lg bg-chart-2 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            )}

            {/* Delete */}
            {sheet.type === "delete" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanently delete <span className="font-bold text-foreground">{workspace.name}</span> and all its data? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="button" onClick={handleDeleteWorkspace} disabled={saving} className="flex-1 py-3 rounded-lg bg-chart-2 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
