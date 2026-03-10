"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Camera,
  Wallet,
  ChevronRight,
  Calendar,
  Home,
  Lock,
  Bell,
  LogOut,
  Users,
} from "lucide-react";
import { loadFixedBills, type FixedBill } from "@/lib/fixed-expenses";
import { formatMoney } from "@/lib/format";

type Workspace = { id: number; name: string; slug: string };
type WorkspaceMember = { id: number; user_id: number; role: string; name: string; email: string };

function WorkspaceSettingsSection() {
  const { workspaceId, setWorkspaceId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    api<Workspace[]>("/api/workspaces")
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setWorkspaces(list);
        const initialId = workspaceId ?? (list[0]?.id ?? null);
        setSelectedWorkspaceId(initialId);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Could not load workspaces.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError("");
    api<WorkspaceMember[]>(`/api/workspaces/${selectedWorkspaceId}/members`)
      .then((res) => {
        setMembers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setMembersError("Could not load members.");
      })
      .finally(() => {
        setMembersLoading(false);
      });
  }, [selectedWorkspaceId]);

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
        setNewName("");
        setWorkspaceId(workspace.id);
        setSelectedWorkspaceId(workspace.id);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("workspaces-refresh"));
        }
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  }

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) ?? null;

  return (
    <section className="space-y-4">
      <h3 className="section-title px-1">Workspace</h3>
      <div className="bg-card rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Current workspace
            </p>
            <p className="text-sm font-bold text-foreground mt-1">
              {currentWorkspace ? currentWorkspace.name : "No workspace selected"}
            </p>
          </div>
          {currentWorkspace && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground font-bold uppercase tracking-widest">
              Active
            </span>
          )}
        </div>

        <div className="p-5 border-b border-white/5 space-y-3">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Your workspaces
          </p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading workspaces…</p>
          ) : error ? (
            <p className="text-xs text-chart-2">{error}</p>
          ) : workspaces.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You do not have any workspaces yet. Create one below.
            </p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((w) => {
                const isActive = workspaceId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkspaceId(w.id);
                      if (!isActive) {
                        setWorkspaceId(w.id);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event("workspaces-refresh"));
                        }
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-background/40 hover:bg-background text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isActive ? "Active workspace" : "Tap to switch"}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              People in this workspace
            </p>
            <Link
              href="/settings/team"
              className="text-[11px] font-bold text-primary uppercase tracking-widest"
            >
              Manage team
            </Link>
          </div>
          {selectedWorkspaceId == null ? (
            <p className="text-xs text-muted-foreground">Select a workspace to see its members.</p>
          ) : membersLoading ? (
            <p className="text-xs text-muted-foreground">Loading members…</p>
          ) : membersError ? (
            <p className="text-xs text-chart-2">{membersError}</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No members yet. Invite people from the team page.
            </p>
          ) : (
            <div className="space-y-2">
              {members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{m.name || m.email}</p>
                      <p className="text-[10px] text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {m.role}
                  </span>
                </div>
              ))}
              {members.length > 5 && (
                <p className="text-[11px] text-muted-foreground">
                  +{members.length - 5} more member{members.length - 5 === 1 ? "" : "s"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Create new workspace
          </p>
          {createError && <p className="text-xs text-chart-2">{createError}</p>}
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Personal, Side project"
              className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {creating ? "Creating…" : "Create workspace"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { user, logout, workspaceId } = useAuth();
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);

  const refreshFixedBills = useCallback(() => {
    setFixedBills(loadFixedBills(workspaceId ?? null));
  }, [workspaceId]);

  useEffect(() => {
    refreshFixedBills();
  }, [refreshFixedBills]);

  useEffect(() => {
    const onRefresh = () => refreshFixedBills();
    window.addEventListener("fixed-bills-refresh", onRefresh);
    return () => window.removeEventListener("fixed-bills-refresh", onRefresh);
  }, [refreshFixedBills]);

  return (
    <div className="space-y-8 pt-4">
      {/* Profile card */}
      <section className="flex flex-col items-center py-6 bg-card rounded-[2.5rem] overflow-hidden">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-foreground">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-4 border-card active:scale-90 transition-all shadow-lg"
            aria-label="Change photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl font-bold mt-4">{user?.name ?? "User"}</h2>
        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">
          {user?.email ?? ""}
        </p>
        <Link
          href="/settings/profile"
          className="mt-6 px-6 py-2.5 bg-secondary rounded-xl text-xs font-bold active:scale-95 transition-all"
        >
          Edit Profile
        </Link>
      </section>

      {/* Financial Setup */}
      <section className="space-y-4">
        <h3 className="section-title px-1">Financial Setup</h3>
        <div className="bg-card rounded-3xl overflow-hidden">
          <Link
            href="/budgets"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Monthly Budgets</p>
                <p className="text-[10px] text-muted-foreground font-medium">Set category limits</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/fixed-expenses"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Fixed Expenses</p>
                <p className="text-[10px] text-muted-foreground font-medium">Manage recurring bills</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* Active Bills */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="section-title">Active Bills</h3>
          <Link href="/settings/fixed-expenses" className="section-title text-primary">
            + Add New
          </Link>
        </div>
        <div className="space-y-3">
          {fixedBills.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              You do not have any fixed expenses yet. Add one to see it here.
            </p>
          ) : (
            fixedBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                    <Home className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{bill.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {bill.frequency === "weekly"
                        ? "Weekly"
                        : bill.dayOfMonth
                          ? `Day ${bill.dayOfMonth} • Monthly`
                          : "Monthly"}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatMoney(bill.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Workspace */}
      <WorkspaceSettingsSection />

      {/* App Settings */}
      <section className="space-y-4">
        <h3 className="section-title px-1">App Settings</h3>
        <div className="bg-card rounded-3xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Security & Login</p>
                <p className="text-[10px] text-muted-foreground font-medium">Password, 2FA, Biometrics</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Notifications</p>
                <p className="text-[10px] text-muted-foreground font-medium">Bill alerts, weekly reports</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Sign Out */}
      <section className="pt-4">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full py-5 bg-chart-2/10 border border-chart-2/20 text-chart-2 font-bold text-sm rounded-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
