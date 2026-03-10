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
        <div className="absolute top-16 left-3 right-3 z-50 bg-card rounded-2xl shadow-xl overflow-hidden w-[calc(100%-1.5rem)] sm:max-w-md sm:mx-auto">
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

      <main className="px-3 pt-3 pb-24 w-full sm:max-w-md sm:mx-auto sm:px-4">
        {children}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-40 px-3 pb-5 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="w-full sm:max-w-md sm:mx-auto bg-card/80 backdrop-blur-2xl rounded-[2.1rem] px-1.5 py-1 flex items-center justify-between shadow-2xl shadow-black/50">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              isDashboard ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/transactions"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              isTransactions ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </Link>
          <div className="flex-1 flex justify-center relative -top-6">
            <Link
              href="/transactions/new"
              className="w-12 h-12 rounded-full bg-white text-black shadow-xl shadow-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-[3px] border-background"
              aria-label="Add transaction"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
          <Link
            href="/budgets"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              isBudgets ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Budgets</span>
          </Link>
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              isSetupRoot || isSettings ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Setup</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
