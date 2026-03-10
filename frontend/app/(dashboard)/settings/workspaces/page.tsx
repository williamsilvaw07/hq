"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Check,
  User,
  BriefcaseBusiness,
  Home,
  LineChart,
} from "lucide-react";

type Workspace = { id: number; name: string; slug: string };

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaceId, setWorkspaceId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
   const [showCreate, setShowCreate] = useState(false);
   const [newName, setNewName] = useState("");
   const [creating, setCreating] = useState(false);
   const [createError, setCreateError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<Workspace[]>("/api/workspaces")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setWorkspaces(list);
      })
      .catch(() => {
        if (!cancelled) setWorkspaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId) ?? null;
  const otherWorkspaces = workspaces.filter((w) => w.id !== workspaceId);

  function handleSelect(w: Workspace) {
    setWorkspaceId(w.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("workspaces-refresh"));
    }
    router.back();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreateError("");
    setCreating(true);
    try {
      const res = await api<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      const workspace = res.data;
      if (workspace) {
        setWorkspaces((prev) => [...prev, workspace]);
        setWorkspaceId(workspace.id);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("workspaces-refresh"));
        }
        setNewName("");
        setShowCreate(false);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground active:scale-95 transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
            Workspace
          </h1>
          <p className="text-sm font-bold text-foreground">Switch Account</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary active:scale-95 transition-all"
          aria-label="New workspace"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 py-4 space-y-6">
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
            Active Now
          </h3>

          {loading ? (
            <p className="text-xs text-muted-foreground px-1">Loading workspaces…</p>
          ) : !activeWorkspace ? (
            <p className="text-xs text-muted-foreground px-1">
              You do not have an active workspace yet.
            </p>
          ) : (
            <div className="relative p-5 bg-card rounded-[2rem] border-2 border-primary/50 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{activeWorkspace.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      Default Workspace
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
            Your Spaces
          </h3>
          {loading ? (
            <p className="text-xs text-muted-foreground px-1">Loading spaces…</p>
          ) : otherWorkspaces.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              You have no other workspaces yet. Create one from Settings.
            </p>
          ) : (
            <div className="space-y-3">
              {otherWorkspaces.map((w, index) => {
                const Icon =
                  index === 0 ? BriefcaseBusiness : index === 1 ? Home : LineChart;
                const description =
                  index === 0
                    ? "Shared"
                    : index === 1
                      ? "Shared"
                      : "Private Space";

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleSelect(w)}
                    className="w-full p-5 bg-card/40 rounded-[2rem] flex items-center justify-between hover:bg-card transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-chart-1/10 flex items-center justify-center border border-chart-1/20">
                        <Icon className="w-6 h-6 text-chart-1" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                          {description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-24 left-6 right-6 p-4 bg-secondary/20 rounded-2xl border border-dashed border-border/60 text-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Long press a workspace to edit settings
        </p>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/70">
          <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Workspace
                </p>
                <h2 className="text-sm font-bold text-foreground mt-1">Create New Space</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Workspace name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Family, Personal"
                  className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
              </div>
              {createError && (
                <p className="text-xs text-chart-2">
                  {createError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError("");
                  }}
                  className="flex-1 py-3 rounded-2xl border border-border text-xs font-bold text-foreground uppercase tracking-widest active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

