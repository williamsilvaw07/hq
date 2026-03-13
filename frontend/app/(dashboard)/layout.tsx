"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { api, buildMediaUrl } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@iconify/react";

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
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("workspaceId");
          router.push("/login");
        }
      });
  }, [setWorkspaceId, workspaceId, router]);

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
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-28 font-sans selection:bg-primary/20 tracking-tight">
      {showSettingsHeader ? (
        <header className="z-40 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
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
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold">Settings</h1>
          </div>
        </header>
      ) : null}
      {/* Per-page headers and navigation are handled by each screen now */}

      {workspaceOpen && workspaces.length > 1 && (
        <div className="absolute top-14 sm:top-16 left-4 right-4 z-50 bg-card rounded-xl sm:rounded-2xl shadow-xl overflow-hidden w-[calc(100%-2rem)] sm:max-w-md sm:mx-auto">
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

      <main className="px-4 pt-3 pb-24 w-full sm:max-w-md sm:mx-auto sm:px-6">
        {children}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 sm:pt-4 bg-gradient-to-t from-background via-background/98 to-transparent pointer-events-none">
        <div className="w-full sm:max-w-md sm:mx-auto pointer-events-auto bg-zinc-900/95 border border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] px-2 py-3 flex items-center justify-between shadow-xl">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isDashboard ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon icon="solar:home-2-bold-duotone" className="text-xl sm:text-2xl" />
            <span>HOME</span>
          </Link>
          <Link
            href="/transactions"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isTransactions ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon icon="solar:history-bold-duotone" className="text-xl sm:text-2xl" />
            <span>HISTORY</span>
          </Link>
          <Link
            href="/transactions/new"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isAddTransaction ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
            aria-label="Add transaction"
          >
            <Icon icon="hugeicons:add-01" className="text-xl sm:text-2xl" />
            <span>ADD</span>
          </Link>
          <Link
            href="/budgets"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isBudgets ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon icon="solar:wallet-bold-duotone" className="text-xl sm:text-2xl" />
            <span>BUDGETS</span>
          </Link>
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isSetupRoot || isSettings ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon icon="solar:settings-bold-duotone" className="text-xl sm:text-2xl" />
            <span>SETUP</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
