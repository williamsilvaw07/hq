"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
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
  Flag,
  LineChart,
} from "lucide-react";
import { loadFixedBills, type FixedBill } from "@/lib/fixed-expenses";
import { formatMoney } from "@/lib/format";

function WorkspaceSettingsSection() {
  const { workspaceId } = useAuth();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadName() {
      if (!workspaceId) {
        setWorkspaceName(null);
        return;
      }
      try {
        const res = await fetch("/api/workspaces");
        const data = (await res.json()) as { data?: { id: number; name: string }[] };
        const list = Array.isArray(data.data) ? data.data : [];
        const current = list.find((w) => w.id === workspaceId);
        if (!cancelled) {
          setWorkspaceName(current?.name ?? null);
        }
      } catch {
        if (!cancelled) setWorkspaceName(null);
      }
    }
    void loadName();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
        Workspace
      </h3>
      <div className="bg-secondary rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-chart-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Workspace</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {workspaceName ?? "Personal Flow"}
              </p>
            </div>
          </div>
          {workspaceName && (
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest">
              Personal Flow
            </span>
          )}
        </div>
        <Link
          href="/settings/workspaces"
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-chart-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Switch Workspace</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Jump between your finance hubs
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/workspaces"
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-chart-1" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">New Workspace</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Create a shared or private space
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/team"
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-chart-3" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Invite Team</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Collaborate on shared finances
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
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
      <section className="flex flex-col items-center py-6 bg-secondary rounded-[2.5rem] overflow-hidden">
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
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
          Financial Setup
        </h3>
        <div className="bg-secondary rounded-3xl overflow-hidden">
          <Link
            href="/budgets"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-border/50"
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
            href="/budgets"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                <Flag className="w-5 h-5 text-chart-1" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Financial Goals</p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Track long-term savings
                </p>
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
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Active Bills
          </h3>
          <Link
            href="/settings/fixed-expenses"
            className="text-[10px] font-bold text-primary uppercase tracking-widest"
          >
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
                className="flex items-center justify-between p-4 bg-secondary rounded-2xl"
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
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
          App Settings
        </h3>
        <div className="bg-secondary rounded-3xl overflow-hidden">
          <Link
            href="/settings/dashboard"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-chart-1" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Dashboard Mode</p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Choose how your dashboard behaves
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <button
            type="button"
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
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
