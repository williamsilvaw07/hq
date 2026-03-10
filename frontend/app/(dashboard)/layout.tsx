"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { api, buildMediaUrl } from "@/lib/api";
import { Home, History, Plus, PieChart, Bell, ArrowLeft } from "lucide-react";

type Workspace = { id: number; name: string; slug: string };

const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "dev";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, workspaceId, setWorkspaceId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const hasRedirectedToLogin = useRef(false);

  const fetchWorkspaces = useCallback(() => {
    api<Workspace[]>("/api/workspaces")
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : [];
        setWorkspaces(list);
        if (list.length > 0 && !workspaceId) setWorkspaceId(list[0].id);
      })
      .catch(() => {});
  }, [setWorkspaceId, workspaceId]);

  useEffect(() => {
    if (loading) return;
    if (user) {
      hasRedirectedToLogin.current = false;
      fetchWorkspaces();
      const onRefresh = () => fetchWorkspaces();
      window.addEventListener("workspaces-refresh", onRefresh);
      return () => window.removeEventListener("workspaces-refresh", onRefresh);
    }
    if (!hasRedirectedToLogin.current) {
      hasRedirectedToLogin.current = true;
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit router: unstable reference causes replaceState throttle
  }, [user, loading, fetchWorkspaces]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);
  const isAddTransaction = pathname === "/transactions/new";
  const isSettings = pathname?.startsWith("/settings");
  const isSettingsProfile = pathname === "/settings/profile";
  const isSettingsTeam = pathname === "/settings/team";
  const isDashboard = pathname === "/dashboard";
  const isTransactions = pathname === "/transactions";
  const isBudgets = pathname === "/budgets";
  const isSetupRoot = pathname === "/settings";
  const settingsTitle =
    pathname === "/settings"
      ? "Settings"
      : pathname === "/settings/fixed-expenses"
        ? "Fixed Expenses"
        : pathname === "/settings/team"
          ? "Team"
          : "Settings";
  const settingsBackHref = pathname === "/settings" ? "/dashboard" : "/settings";
  const showSettingsHeader = isSettings && !isSettingsProfile && !isSettingsTeam;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 font-sans selection:bg-primary/20 tracking-tight">
      {showSettingsHeader ? (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(settingsBackHref);
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Settings</h1>
          </div>
        </header>
      ) : null}
      {/* Per-page headers and navigation are handled by each screen now */}

      {workspaceOpen && workspaces.length > 1 && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-card rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto w-[calc(100%-2rem)]">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setWorkspaceId(w.id);
                setWorkspaceOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-secondary last:border-0"
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      <main className="px-4 pt-4 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto bg-card/80 backdrop-blur-2xl border border-white/5 rounded-[2.25rem] px-2 py-1.5 flex items-center justify-between shadow-2xl shadow-black/50">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-black uppercase tracking-widest ${
              isDashboard ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/transactions"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-black uppercase tracking-widest ${
              isTransactions ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </Link>
          <div className="flex-1 flex justify-center relative -top-7">
            <Link
              href="/transactions/new"
              className="w-14 h-14 rounded-full bg-white text-black shadow-xl shadow-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-[3px] border-background"
              aria-label="Add transaction"
            >
              <Plus className="w-6 h-6" />
            </Link>
          </div>
          <Link
            href="/budgets"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-black uppercase tracking-widest ${
              isBudgets ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span>Budgets</span>
          </Link>
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-black uppercase tracking-widest ${
              isSetupRoot || isSettings ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Setup</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
