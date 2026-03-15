"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ArrowLeft, Pencil, Trash2, UserPlus, X, Check, Crown, Shield, Eye, User, Loader2, Send, Copy, CheckCheck,
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

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  owner:  { icon: <Crown  className="w-3.5 h-3.5" />, label: "Owner",  color: "text-yellow-400 bg-yellow-400/10" },
  admin:  { icon: <Shield className="w-3.5 h-3.5" />, label: "Admin",  color: "text-blue-400   bg-blue-400/10"   },
  member: { icon: <User   className="w-3.5 h-3.5" />, label: "Member", color: "text-muted-foreground bg-white/5" },
  viewer: { icon: <Eye    className="w-3.5 h-3.5" />, label: "Viewer", color: "text-muted-foreground bg-white/5" },
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

  const [name, setName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("BRL");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedRole, setSelectedRole] = useState("member");

  // Telegram
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramCopied, setTelegramCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    Promise.all([
      api<Workspace>(`/api/workspaces/${id}`).catch((err) => {
        console.error("[workspace] Failed to load workspace:", err);
        return { data: null as Workspace | null };
      }),
      api<Member[]>(`/api/workspaces/${id}/members`).catch((err) => {
        console.error("[workspace] Failed to load members:", err);
        return { data: [] as Member[] };
      }),
    ])
      .then(([wRes, mRes]) => {
        setWorkspace((wRes as any).data ?? null);
        setMembers(Array.isArray((mRes as any).data) ? (mRes as any).data : []);
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
    } catch { setError("Failed to update name."); }
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

  async function handleGenerateTelegramCode() {
    setTelegramLoading(true);
    try {
      const res = await api<{ code: string }>(`/api/workspaces/${id}/telegram/link`, { method: "POST" });
      if (res.data?.code) setTelegramCode(res.data.code);
    } catch { /* ignore */ }
    finally { setTelegramLoading(false); }
  }

  async function handleCopyTelegramCode() {
    if (!telegramCode) return;
    await navigator.clipboard.writeText(telegramCode);
    setTelegramCopied(true);
    setTimeout(() => setTelegramCopied(false), 2000);
  }

  const currencyInfo = CURRENCIES.find((c) => c.code === workspace?.currency) ?? CURRENCIES[0];
  const isActive = Number(id) === activeWorkspaceId;
  const myMember = members.find((m) => m.email === authUser?.email);
  const isOwner = myMember?.role === "owner";

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3.5 w-28 bg-white/[0.06] rounded animate-pulse" />
          </div>
        </header>
        <div className="px-4 space-y-6 pt-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
            <div className="bg-card rounded-2xl p-4 space-y-4">
              <div className="h-12 bg-white/[0.06] rounded-xl animate-pulse" />
              <div className="h-12 bg-white/[0.06] rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
            <div className="bg-card rounded-2xl p-4 space-y-3">
              <div className="h-10 bg-white/[0.06] rounded-xl animate-pulse" />
              <div className="h-10 bg-white/[0.06] rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Workspace</p>
          <p className="text-sm font-bold truncate">{workspace.name}</p>
        </div>
        {isActive && (
          <span className="text-[10px] font-normal text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1 uppercase tracking-widest shrink-0">
            Active
          </span>
        )}
      </header>

      <div className="px-4 space-y-6 pt-2">

        {/* General */}
        <section className="space-y-2">
          <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">General</p>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {/* Name */}
            <button
              type="button"
              onClick={() => openSheet({ type: "edit-name" })}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
            >
              <div className="text-left min-w-0">
                <p className="text-[10px] font-normal text-muted-foreground/60 uppercase tracking-widest mb-0.5">Workspace Name</p>
                <p className="text-sm font-bold text-foreground truncate">{workspace.name}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0 ml-3">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
            {/* Currency */}
            <button
              type="button"
              onClick={() => openSheet({ type: "currency" })}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
            >
              <div className="text-left min-w-0">
                <p className="text-[10px] font-normal text-muted-foreground/60 uppercase tracking-widest mb-0.5">Currency</p>
                <p className="text-sm font-bold text-foreground">
                  {currencyInfo.symbol} · {currencyInfo.code} — {currencyInfo.label}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0 ml-3">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
          </div>
        </section>

        {/* Team Members */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Team Members</p>
            <button
              type="button"
              onClick={() => openSheet({ type: "invite" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              <UserPlus className="w-3 h-3" /> Invite
            </button>
          </div>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-5">No members yet.</p>
            ) : (
              members.map((m) => {
                const isMe = m.email === authUser?.email;
                const canManage = isOwner && !isMe && m.role !== "owner";
                const role = ROLE_META[m.role] ?? ROLE_META.member;
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {m.name}
                          {isMe && <span className="text-muted-foreground font-normal text-xs"> (you)</span>}
                        </p>
                        <p className="text-[10px] font-normal text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-normal uppercase tracking-widest ${role.color}`}>
                        {role.icon} {role.label}
                      </span>
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
              })
            )}
          </div>
        </section>

        {/* Telegram */}
        <section className="space-y-2">
          <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">Integrations</p>
          <div className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold">Connect Telegram</p>
                <p className="text-[10px] font-normal text-muted-foreground">
                  Log expenses for <span className="text-foreground font-semibold">{workspace.name}</span> via bot
                </p>
              </div>
            </div>
            {!telegramCode ? (
              <button
                type="button"
                onClick={handleGenerateTelegramCode}
                disabled={telegramLoading}
                className="w-full py-2.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {telegramLoading ? "Generating…" : "Generate Linking Code"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-normal text-muted-foreground">
                  Send this code to your Telegram bot. Expires in 15 minutes.
                </p>
                <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
                  <span className="text-xl font-mono font-bold tracking-widest text-foreground">{telegramCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyTelegramCode}
                    className="text-muted-foreground active:scale-90 transition-all"
                    aria-label="Copy code"
                  >
                    {telegramCopied
                      ? <CheckCheck className="w-5 h-5 text-emerald-400" />
                      : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateTelegramCode}
                  disabled={telegramLoading}
                  className="w-full py-2 text-[10px] font-normal text-muted-foreground uppercase tracking-widest"
                >
                  {telegramLoading ? "Generating…" : "Generate New Code"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        {isOwner && (
          <section className="space-y-2 pt-2">
            <p className="text-[10px] font-normal text-chart-2/60 uppercase tracking-[0.2em] px-1">Danger Zone</p>
            <button
              type="button"
              onClick={() => openSheet({ type: "delete" })}
              className="w-full py-4 bg-chart-2/10 border border-chart-2/20 text-chart-2 font-bold text-sm rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Workspace
            </button>
          </section>
        )}
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-md bg-[#1c1c1e] rounded-t-[2rem] p-6 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center -mt-2 mb-1">
              <div className="w-10 h-[5px] rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-base font-bold">
                {sheet.type === "edit-name"      && "Edit Workspace Name"}
                {sheet.type === "currency"       && "Change Currency"}
                {sheet.type === "invite"         && "Invite Member"}
                {sheet.type === "change-role"    && "Change Role"}
                {sheet.type === "remove-member"  && "Remove Member"}
                {sheet.type === "delete"         && "Delete Workspace"}
              </p>
              <button type="button" onClick={closeSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.07] text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-chart-2 bg-chart-2/10 rounded-lg px-3 py-2">{error}</p>}

            {/* Edit Name */}
            {sheet.type === "edit-name" && (
              <form onSubmit={handleSaveName} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={saving || !name.trim()} className="flex-[1.4] py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save"}
                  </button>
                </div>
              </form>
            )}

            {/* Currency */}
            {sheet.type === "currency" && (
              <form onSubmit={handleSaveCurrency} className="space-y-4">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedCurrency === c.code ? "bg-white/10 text-foreground" : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold w-8 text-left">{c.symbol}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{c.code}</p>
                          <p className="text-[10px] font-normal text-muted-foreground">{c.label}</p>
                        </div>
                      </div>
                      {selectedCurrency === c.code && <Check className="w-4 h-4 text-foreground" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-[1.4] py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save"}
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
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20"
                  autoFocus
                />
                <div className="grid grid-cols-3 bg-black/30 p-1 rounded-full gap-1">
                  {(["member", "admin", "viewer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${inviteRole === r ? "bg-white text-black shadow-sm" : "text-muted-foreground/60"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={saving || !inviteEmail.trim()} className="flex-[1.4] py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send Invite"}
                  </button>
                </div>
              </form>
            )}

            {/* Change Role */}
            {sheet.type === "change-role" && (
              <form onSubmit={handleChangeRole} className="space-y-4">
                <p className="text-sm text-muted-foreground">Changing role for <span className="font-bold text-foreground">{sheet.member.name}</span></p>
                <div className="grid grid-cols-3 bg-black/30 p-1 rounded-full gap-1">
                  {(["admin", "member", "viewer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedRole === r ? "bg-white text-black shadow-sm" : "text-muted-foreground/60"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-[1.4] py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save"}
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
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="button" onClick={handleRemoveMember} disabled={saving} className="flex-[1.4] py-3.5 rounded-full bg-chart-2 text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Removing…</> : "Remove"}
                  </button>
                </div>
              </div>
            )}

            {/* Delete Workspace */}
            {sheet.type === "delete" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanently delete <span className="font-bold text-foreground">{workspace.name}</span> and all its data? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="button" onClick={handleDeleteWorkspace} disabled={saving} className="flex-[1.4] py-3.5 rounded-full bg-chart-2 text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : "Delete"}
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
