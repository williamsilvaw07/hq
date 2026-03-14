"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Plus, Check, ChevronRight, X } from "lucide-react";

type Workspace = { id: number; name: string; slug: string };

type Sheet = { type: "create" };

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaceId, setWorkspaceId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  function openSheet(s: Sheet) {
    setError("");
    setName("");
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
                className={`bg-card rounded-xl flex items-center justify-between ${isActive ? "ring-1 ring-primary/40" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => { setWorkspaceId(w.id); window.dispatchEvent(new Event("workspaces-refresh")); }}
                  className="flex items-center gap-3 flex-1 text-left p-4"
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
                <div className="flex items-center gap-2 pr-3">
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <Link
                    href={`/settings/workspaces/${w.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Sheet overlay */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
          <div className="w-full max-w-lg bg-popover border-t border-border/20 rounded-t-2xl p-6 shadow-2xl space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Create Workspace</h2>
              <button type="button" onClick={closeSheet} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-chart-2">{error}</p>}

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

          </div>
        </div>
      )}
    </div>
  );
}
