"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ArrowLeft, Pencil, Trash2, UserPlus, X, Check, Crown, Shield, Eye, User, Loader2, Send, Copy, CheckCheck, ChevronRight,
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("BRL");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedRole, setSelectedRole] = useState("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Telegram
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramCopied, setTelegramCopied] = useState(false);

  // WhatsApp
  const [whatsappCode, setWhatsappCode] = useState<string | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Integration status
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [connectedWhatsappId, setConnectedWhatsappId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    setLoadError(null);
    Promise.all([
      api<Workspace>(`/api/workspaces/${id}`).catch((err) => {
        console.error("[workspace] Failed to load workspace:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load workspace");
        return { data: null as Workspace | null };
      }),
      api<Member[]>(`/api/workspaces/${id}/members`).catch((err) => {
        console.error("[workspace] Failed to load members:", err);
        return { data: [] as Member[] };
      }),
      api<{ telegram_connected: boolean; whatsapp_connected: boolean; whatsapp_id: string | null }>(`/api/workspaces/${id}/integrations/status`).catch(() => {
        return { data: { telegram_connected: false, whatsapp_connected: false, whatsapp_id: null } };
      }),
    ])
      .then(([wRes, mRes, iRes]) => {
        setWorkspace((wRes as any).data ?? null);
        setMembers(Array.isArray((mRes as any).data) ? (mRes as any).data : []);
        const integrations = (iRes as any).data;
        if (integrations) {
          setTelegramConnected(integrations.telegram_connected);
          setWhatsappConnected(integrations.whatsapp_connected);
          setConnectedWhatsappId(integrations.whatsapp_id);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function openSheet(s: Sheet) {
    setError("");
    if (s.type === "edit-name") setName(workspace?.name ?? "");
    if (s.type === "currency") setSelectedCurrency(workspace?.currency ?? "BRL");
    if (s.type === "invite") { setInviteEmail(""); setInviteRole("member"); setInviteLink(null); setInviteCopied(false); }
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
      const res = await api<{ invite_link: string }>(`/api/workspaces/${id}/members/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setInviteLink(res.data?.invite_link ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create invite."); }
    finally { setSaving(false); }
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
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

  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  async function handleGenerateWhatsappCode() {
    setWhatsappLoading(true);
    setWhatsappError(null);
    try {
      const res = await api<{ code: string }>(`/api/workspaces/${id}/whatsapp/link`, { method: "POST" });
      if (res.data?.code) setWhatsappCode(res.data.code);
      else setWhatsappError("No code returned. Try again.");
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function handleCopyWhatsappCode() {
    if (!whatsappCode) return;
    await navigator.clipboard.writeText(whatsappCode);
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2000);
  }

  async function handleGenerateTelegramCode() {
    setTelegramLoading(true);
    setTelegramError(null);
    try {
      const res = await api<{ code: string }>(`/api/workspaces/${id}/telegram/link`, { method: "POST" });
      if (res.data?.code) setTelegramCode(res.data.code);
      else setTelegramError("No code returned. Try again.");
    } catch (err) {
      setTelegramError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setTelegramLoading(false);
    }
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
  const isAdmin = myMember?.role === "admin" || isOwner;
  const canEdit = isAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-5 py-3 flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3.5 w-28 bg-white/[0.06] rounded animate-pulse" />
          </div>
        </header>
        <div className="px-5 space-y-6 pt-4">
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted-foreground">Workspace not found.</p>
        {loadError && (
          <p className="text-[11px] sm:text-xs text-chart-2/60 font-mono text-center max-w-xs">{loadError}</p>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-xl bg-card text-sm font-bold active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-5 py-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspace</p>
          <p className="text-sm font-bold truncate">{workspace.name}</p>
        </div>
        {isActive && (
          <span className="text-[11px] sm:text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1 uppercase tracking-wider shrink-0">
            Active
          </span>
        )}
      </header>

      <div className="px-5 space-y-6 pt-2">

        {/* General */}
        <section className="space-y-2">
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">General</p>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {/* Name */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => openSheet({ type: "edit-name" })}
                className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Workspace Name</p>
                  <p className="text-sm font-bold text-foreground truncate">{workspace.name}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0 ml-3">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            ) : (
              <div className="px-4 py-4">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Workspace Name</p>
                <p className="text-sm font-bold text-foreground truncate">{workspace.name}</p>
              </div>
            )}
            {/* Currency */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => openSheet({ type: "currency" })}
                className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Currency</p>
                  <p className="text-sm font-bold text-foreground">
                    {currencyInfo.symbol} · {currencyInfo.code} — {currencyInfo.label}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0 ml-3">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            ) : (
              <div className="px-4 py-4">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Currency</p>
                <p className="text-sm font-bold text-foreground">
                  {currencyInfo.symbol} · {currencyInfo.code} — {currencyInfo.label}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Team Members */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Members</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => openSheet({ type: "invite" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] sm:text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
              >
                <UserPlus className="w-3 h-3" /> Invite
              </button>
            )}
          </div>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-5">No members yet.</p>
            ) : (
              members.map((m) => {
                const isMe = m.email === authUser?.email;
                const canManage = canEdit && !isMe && m.role !== "owner" && (isOwner || m.role !== "admin");
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
                        <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium uppercase tracking-wider ${role.color}`}>
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
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Integrations</p>
          <div className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">Telegram</p>
                  {telegramConnected && (
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 uppercase tracking-wider">Connected</span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  {telegramConnected
                    ? <>Linked to <span className="text-foreground font-semibold">{workspace.name}</span></>
                    : <>Log expenses &amp; income for <span className="text-foreground font-semibold">{workspace.name}</span> via bot</>}
                </p>
              </div>
            </div>
            {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
              <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl active:scale-[0.98] transition-all"
              >
                <Send className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-400">@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground/60">Tap to open bot in Telegram</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400/40 shrink-0" />
              </a>
            )}
            {telegramConnected && !telegramCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-2.5">
                  <CheckCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Telegram is linked.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateTelegramCode}
                  disabled={telegramLoading}
                  className="w-full py-2 text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {telegramLoading ? "Generating…" : "Re-link with new code"}
                </button>
              </div>
            ) : !telegramCode ? (
              <div className="space-y-3">
                <div className="bg-white/[0.03] rounded-xl p-3 space-y-2">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">How it works</p>
                  <ol className="text-[11px] sm:text-xs text-muted-foreground/50 space-y-1.5 list-decimal list-inside">
                    <li>Generate a linking code below</li>
                    <li>Open the bot in Telegram{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ? ` (@${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME})` : ""}</li>
                    <li>Send the code to the bot</li>
                    <li>Done! Send expenses or income via text, voice, or photo</li>
                  </ol>
                </div>
                {telegramError && (
                  <p className="text-xs text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-xl p-2.5">{telegramError}</p>
                )}
                <button
                  type="button"
                  onClick={handleGenerateTelegramCode}
                  disabled={telegramLoading}
                  className="w-full py-2.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {telegramLoading ? "Generating…" : "Generate Linking Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  Send this code to the bot{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ? ` (@${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME})` : ""} in Telegram. Expires in 15 minutes.
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
                  className="w-full py-2 text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {telegramLoading ? "Generating…" : "Generate New Code"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* WhatsApp */}
        <section className="space-y-2">
          <div className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">WhatsApp</p>
                  {whatsappConnected && (
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 uppercase tracking-wider">Connected</span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  {whatsappConnected
                    ? <>Linked as <span className="text-foreground font-semibold">+{connectedWhatsappId}</span></>
                    : <>Log expenses &amp; income for <span className="text-foreground font-semibold">{workspace.name}</span> via WhatsApp</>}
                </p>
              </div>
            </div>
            {whatsappConnected && !whatsappCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-400/5 border border-emerald-400/10 rounded-xl px-3 py-2.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">WhatsApp is linked.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateWhatsappCode}
                  disabled={whatsappLoading}
                  className="w-full py-2 text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {whatsappLoading ? "Generating…" : "Re-link with new code"}
                </button>
              </div>
            ) : !whatsappCode ? (
              <div className="space-y-3">
                <div className="bg-white/[0.03] rounded-xl p-3 space-y-2">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">How it works</p>
                  <ol className="text-[11px] sm:text-xs text-muted-foreground/50 space-y-1.5 list-decimal list-inside">
                    <li>Generate a linking code below</li>
                    <li>Open the NorthTrack number on WhatsApp</li>
                    <li>Send the code as a message</li>
                    <li>Done! Send expenses or income via text, voice, or photo</li>
                  </ol>
                </div>
                {whatsappError && (
                  <p className="text-xs text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-xl p-2.5">{whatsappError}</p>
                )}
                <button
                  type="button"
                  onClick={handleGenerateWhatsappCode}
                  disabled={whatsappLoading}
                  className="w-full py-2.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {whatsappLoading ? "Generating…" : "Generate Linking Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  Send this code to the NorthTrack WhatsApp number. Expires in 15 minutes.
                </p>
                <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
                  <span className="text-xl font-mono font-bold tracking-widest text-foreground">{whatsappCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyWhatsappCode}
                    className="text-muted-foreground active:scale-90 transition-all"
                    aria-label="Copy code"
                  >
                    {whatsappCopied
                      ? <CheckCheck className="w-5 h-5 text-emerald-400" />
                      : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateWhatsappCode}
                  disabled={whatsappLoading}
                  className="w-full py-2 text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {whatsappLoading ? "Generating…" : "Generate New Code"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        {isOwner && (
          <section className="space-y-2 pt-2">
            <p className="text-[11px] sm:text-xs font-medium text-chart-2/60 uppercase tracking-wider px-1">Danger Zone</p>
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
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{c.label}</p>
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
            {sheet.type === "invite" && !inviteLink && (
              <form onSubmit={handleInvite} className="space-y-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20"
                  autoFocus
                />
                <div className="space-y-1">
                  {([
                    { id: "member" as const, desc: "Can add and edit their own transactions" },
                    { id: "admin" as const, desc: "Full access — manage budgets, cards & members" },
                    { id: "viewer" as const, desc: "Read-only access to all workspace data" },
                  ]).map(({ id, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setInviteRole(id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${inviteRole === id ? "bg-white/10 text-foreground" : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide">{id}</p>
                      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={saving || !inviteEmail.trim()} className="flex-[1.4] py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "Generate Link"}
                  </button>
                </div>
              </form>
            )}

            {/* Invite Link Generated */}
            {sheet.type === "invite" && inviteLink && (
              <div className="space-y-4">
                <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 font-bold">Invite link created!</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                    Share this link with <span className="text-foreground font-semibold">{inviteEmail}</span>. They can sign up or log in to join as <span className="text-foreground font-semibold">{inviteRole}</span>.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3 gap-3">
                  <span className="text-xs font-mono text-foreground truncate flex-1">{inviteLink}</span>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="text-muted-foreground active:scale-90 transition-all shrink-0"
                    aria-label="Copy link"
                  >
                    {inviteCopied
                      ? <CheckCheck className="w-5 h-5 text-emerald-400" />
                      : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground/50 text-center">Link expires in 7 days</p>
                <div className="flex gap-3">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3.5 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">Done</button>
                  <button
                    type="button"
                    onClick={() => { setInviteLink(null); setInviteEmail(""); setInviteCopied(false); }}
                    className="flex-1 py-3.5 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Invite Another
                  </button>
                </div>
              </div>
            )}

            {/* Change Role */}
            {sheet.type === "change-role" && (
              <form onSubmit={handleChangeRole} className="space-y-4">
                <p className="text-sm text-muted-foreground">Changing role for <span className="font-bold text-foreground">{sheet.member.name}</span></p>
                <div className="space-y-1">
                  {([
                    { id: "admin" as const, desc: "Full access — manage budgets, cards & members" },
                    { id: "member" as const, desc: "Can add and edit their own transactions" },
                    { id: "viewer" as const, desc: "Read-only access to all workspace data" },
                  ]).map(({ id, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedRole(id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedRole === id ? "bg-white/10 text-foreground" : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide">{id}</p>
                      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/60 mt-0.5">{desc}</p>
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
