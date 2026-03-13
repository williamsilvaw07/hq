"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Check, Pencil, Trash2, UserPlus, X } from "lucide-react";

type Workspace = { id: number; name: string; slug: string };

type Sheet =
  | { type: "create" }
  | { type: "edit"; workspace: Workspace }
  | { type: "delete"; workspace: Workspace }
  | { type: "invite"; workspace: Workspace };

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaceId, setWorkspaceId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  function openSheet(s: Sheet) {
    setError("");
    if (s.type === "edit") setName(s.workspace.name);
    else if (s.type === "create") setName("");
    else if (s.type === "invite") { setInviteEmail(""); setInviteRole("member"); }
    setSheet(s);
  }

  function closeSheet() {
    setSheet(null);
    setError("");
  }

  useEffect(() => {
    setLoading(true);
    api<Workspace[]>("/api/workspaces")
      .then((res) => setWorkspaces(Array.isArray(res.data) ? res.data : []))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    api<Workspace[]>("/api/workspaces")
      .then((res) => setWorkspaces(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true); setError("");
    try {
      const res = await api<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.data) {
        setWorkspaceId(res.data.id);
        window.dispatchEvent(new Event("workspaces-refresh"));
        refresh();
        closeSheet();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
    } finally { setSaving(false); }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (sheet?.type !== "edit" || !name.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${sheet.workspace.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      window.dispatchEvent(new Event("workspaces-refresh"));
      refresh();
      closeSheet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (sheet?.type !== "delete" || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${sheet.workspace.id}`, { method: "DELETE" });
      const remaining = workspaces.filter((w) => w.id !== sheet.workspace.id);
      setWorkspaces(remaining);
      if (workspaceId === sheet.workspace.id && remaining.length > 0) {
        setWorkspaceId(remaining[0].id);
      }
      window.dispatchEvent(new Event("workspaces-refresh"));
      closeSheet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally { setSaving(false); }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (sheet?.type !== "invite" || !inviteEmail.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await api(`/api/workspaces/${sheet.workspace.id}/members/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      closeSheet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite.");
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight">
      <header className="z-40 bg-background/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Workspace</p>
          <p className="text-sm font-bold text-foreground">Manage Spaces</p>
        </div>
        <button
          type="button"
          onClick={() => openSheet({ type: "create" })}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 py-4 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground px-1">Loading…</p>
        ) : (
          workspaces.map((w) => {
            const isActive = w.id === workspaceId;
            return (
              <div
                key={w.id}
                className={`p-4 bg-card rounded-xl flex items-center justify-between ${isActive ? "ring-1 ring-primary/40" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => { setWorkspaceId(w.id); window.dispatchEvent(new Event("workspaces-refresh")); router.back(); }}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black ${isActive ? "bg-primary/20 text-primary" : "bg-secondary/50 text-muted-foreground"}`}>
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                      {isActive ? "Active" : w.slug}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mr-1">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openSheet({ type: "invite", workspace: w })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openSheet({ type: "edit", workspace: w })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openSheet({ type: "delete", workspace: w })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-chart-2 hover:bg-chart-2/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Sheet overlay */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0">
          <div className="w-full max-w-lg bg-card rounded-t-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {sheet.type === "create" ? "New Space" : sheet.type === "edit" ? "Edit Space" : sheet.type === "delete" ? "Delete Space" : "Invite Member"}
                </p>
                <h2 className="text-sm font-bold text-foreground mt-0.5">
                  {sheet.type === "create" ? "Create Workspace" : sheet.type === "edit" ? sheet.workspace.name : sheet.type === "delete" ? "Are you sure?" : `Invite to ${sheet.workspace.name}`}
                </h2>
              </div>
              <button type="button" onClick={closeSheet} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-chart-2">{error}</p>}

            {/* Create */}
            {sheet.type === "create" && (
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving || !name.trim()} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Creating…" : "Create"}
                  </button>
                </div>
              </form>
            )}

            {/* Edit */}
            {sheet.type === "edit" && (
              <form onSubmit={handleEdit} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={saving || !name.trim()} className="flex-1 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Delete */}
            {sheet.type === "delete" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete <span className="font-bold text-foreground">{sheet.workspace.name}</span> and all its data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={closeSheet} className="flex-1 py-3 rounded-lg border border-border text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel</button>
                  <button type="button" onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-lg bg-chart-2 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40">
                    {saving ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            )}

            {/* Invite */}
            {sheet.type === "invite" && (
              <form onSubmit={handleInvite} className="space-y-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
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
          </div>
        </div>
      )}
    </div>
  );
}
