"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Wallet,
  ChevronRight,
  Calendar,
  LogOut,
  Users,
} from "lucide-react";

function WorkspaceSettingsSection() {
  const { workspaceId } = useAuth();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadName() {
      if (!workspaceId) { setWorkspaceName(null); return; }
      try {
        const r = await api<{ id: number; name: string }[]>("/api/workspaces");
        const list = Array.isArray(r.data) ? r.data : [];
        const current = list.find((w) => w.id === workspaceId);
        if (!cancelled) setWorkspaceName(current?.name ?? null);
      } catch {
        if (!cancelled) setWorkspaceName(null);
      }
    }
    void loadName();
    return () => { cancelled = true; };
  }, [workspaceId]);

  return (
    <section className="space-y-3 sm:space-y-4">
      <h3 className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">
        Workspace
      </h3>
      <div className="bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
        {workspaceId && (
          <Link
            href={`/settings/workspaces/${workspaceId}`}
            className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-white/5 transition-colors border-b border-border/50"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-chart-4/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-chart-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{workspaceName ?? "Workspace"}</p>
                <p className="text-[10px] text-muted-foreground font-normal">
                  Currency, members, Telegram &amp; settings
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
        <Link
          href="/settings/workspaces"
          className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-chart-4/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-chart-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">All Workspaces</p>
              <p className="text-[10px] text-muted-foreground font-normal">
                Switch or create a workspace
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
  const { user, logout } = useAuth();

  return (
    <div className="space-y-5 sm:space-y-8 pt-2 sm:pt-4 px-4 sm:px-6">
      {/* Profile card */}
      <section className="flex flex-col items-center py-4 sm:py-6 bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center text-xl sm:text-2xl font-bold text-foreground">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <h2 className="text-lg sm:text-xl font-bold mt-3 sm:mt-4">{user?.name ?? "User"}</h2>
        <p className="text-xs text-muted-foreground font-normal mt-0.5 sm:mt-1 uppercase tracking-widest">
          {user?.email ?? ""}
        </p>
        <Link
          href="/settings/profile"
          className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-secondary rounded-xl text-xs font-bold active:scale-95 transition-all"
        >
          Edit Profile
        </Link>
      </section>

      {/* Financial Setup */}
      <section className="space-y-3 sm:space-y-4">
        <h3 className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">
          Financial Setup
        </h3>
        <div className="bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
          <Link
            href="/budgets"
            className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-white/5 transition-colors border-b border-border/50"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Monthly Budgets</p>
                <p className="text-[10px] text-muted-foreground font-normal">Set category limits</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/fixed-expenses"
            className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Fixed Expenses</p>
                <p className="text-[10px] text-muted-foreground font-normal">Manage recurring bills</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* Workspace */}
      <WorkspaceSettingsSection />

      {/* Sign Out */}
      <section className="pt-2 sm:pt-4">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full py-3 sm:py-4 bg-chart-2/10 border border-chart-2/20 text-chart-2 font-bold text-sm rounded-lg sm:rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
