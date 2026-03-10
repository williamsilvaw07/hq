"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { api, buildMediaUrl } from "@/lib/api";
import {
  Home,
  History,
  Plus,
  CreditCard,
  PieChart,
  Bell,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20">
      {showSettingsHeader ? (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(settingsBackHref)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{settingsTitle}</h1>
              {currentWorkspace && (
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                  Workspace: {currentWorkspace.name}
                </p>
              )}
            </div>
          </div>
          <span className="text-[9px] text-muted-foreground/80" title="Testing only – confirms deploy">
            v{BUILD_VERSION}
          </span>
        </header>
      ) : null}
      {!isSettings ? (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="active:scale-95 transition-all outline-none">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={buildMediaUrl(user.avatar_url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="grayscale">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
            </Link>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Workspace: {currentWorkspace?.name ?? "No workspace"}
              </p>
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/80 mr-1" title="Testing only – confirms deploy">
              v{BUILD_VERSION}
            </span>
            {workspaces.length > 1 && (
              <button
                type="button"
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card text-xs text-muted-foreground"
              >
                {currentWorkspace?.name} <ChevronDown className="w-3 h-3" />
              </button>
            )}
            <Link
              href="/settings"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
              aria-label="Notifications and settings"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </header>
      ) : null}

      {workspaceOpen && workspaces.length > 1 && (
        <div className="absolute top-16 left-6 right-6 z-50 bg-card rounded-2xl shadow-xl overflow-hidden">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setWorkspaceId(w.id);
                setWorkspaceOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-secondary border-b border-white/5 last:border-0"
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      <main className="px-6">{children}</main>

      {!isAddTransaction && (
        <div className="fixed bottom-0 left-0 w-full z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="mb-1 flex justify-center">
            <span className="text-[9px] text-muted-foreground">
              Build {BUILD_VERSION}
            </span>
          </div>
          <div className="bg-card/80 backdrop-blur-2xl rounded-[2.5rem] p-2 flex items-center shadow-2xl shadow-black/50">
            <Link href="/dashboard" className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Home className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-widest">HOME</span>
            </Link>
            <Link href="/transactions" className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors ${pathname === "/transactions" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <History className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-widest">ACTIVITY</span>
            </Link>
            <div className="flex-1 flex justify-center relative -top-8">
              <Link href="/transactions/new" className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-xl shadow-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-4 border-background">
                <Plus className="w-7 h-7" />
              </Link>
            </div>
            <Link href="/accounts" className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors ${pathname === "/accounts" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <CreditCard className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-widest">CARDS</span>
            </Link>
            <Link href="/budgets" className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors ${pathname === "/budgets" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <PieChart className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-widest">STATS</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
