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

import { TransactionModal } from "./transactions/TransactionModal";

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
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const hasRedirectedToLogin = useRef(false);

  const fetchData = useCallback(() => {
    if (!workspaceId) {
      // Still fetch workspaces so we can auto-select one
      api<Workspace[]>("/api/workspaces").then((workRes) => {
        const list = Array.isArray(workRes?.data) ? workRes.data : [];
        setWorkspaces(list);
        if (list.length > 0) setWorkspaceId(list[0].id);
      }).catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("workspaceId");
          router.push("/login");
        }
      });
      return;
    }
    Promise.all([
      api<Workspace[]>("/api/workspaces"),
      api<any[]>(`/api/workspaces/${workspaceId}/categories`),
      api<any>(`/api/workspaces/${workspaceId}/accounts`),
    ]).then(([workRes, catRes, accRes]) => {
      const list = Array.isArray(workRes?.data) ? workRes.data : [];
      setWorkspaces(list);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setAccounts(accRes.data?.accounts || []);
    }).catch((err: unknown) => {
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
      fetchData();
    } else if (!hasRedirectedToLogin.current) {
      hasRedirectedToLogin.current = true;
      router.push("/login");
    }
  }, [user, loading, fetchData, router]);

  useEffect(() => {
    const handleOpenAdd = () => setTransactionModalOpen(true);
    window.addEventListener("open-add-transaction", handleOpenAdd);
    return () => window.removeEventListener("open-add-transaction", handleOpenAdd);
  }, []);

  async function handleSaveTransaction(data: any) {
    if (!workspaceId) return;
    setSavingTransaction(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setTransactionModalOpen(false);
      // Trigger a refresh event for pages to update
      window.dispatchEvent(new CustomEvent("transactions-refresh"));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTransaction(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  const isSettings = pathname?.startsWith("/settings");
  const isSettingsProfile = pathname === "/settings/profile";
  const isSettingsTeam = pathname === "/settings/team";
  const isFixedExpenses = pathname === "/settings/fixed-expenses";
  const isWorkspacePage = pathname?.startsWith("/settings/workspaces");
  const isDashboard = pathname === "/dashboard";
  const isTransactions = pathname === "/transactions";
  const isBudgets = pathname === "/budgets";
  const isSetupRoot = pathname === "/settings";
  const showSettingsHeader = isSettings && !isSettingsProfile && !isSettingsTeam && !isFixedExpenses && !isWorkspacePage;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-28 font-sans transition-colors duration-500">
      {showSettingsHeader && (
        <header className="z-40 bg-background/80 backdrop-blur-md px-5 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Settings</h1>
        </header>
      )}

      <main className="w-full sm:max-w-md sm:mx-auto">
        {children}
      </main>

      <div className="fixed bottom-0 left-0 w-full z-40 px-5 pb-8 sm:pb-10 pt-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <div className="w-full sm:max-w-md sm:mx-auto pointer-events-auto bg-zinc-900/95 border border-zinc-800/50 rounded-xl px-2 py-3 flex items-center justify-between shadow-2xl">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
              isDashboard ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon icon="solar:home-2-bold-duotone" className="text-xl sm:text-2xl" />
            <span>HOME</span>
          </Link>
          <Link
            href="/transactions"
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
              isTransactions ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon icon="solar:history-bold-duotone" className="text-xl sm:text-2xl" />
            <span>HISTORY</span>
          </Link>
          
          <button
            onClick={() => setTransactionModalOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center -mt-8 shadow-xl shadow-black/40 active:scale-90 transition-all">
              <Icon icon="hugeicons:add-01" className="text-2xl text-black" />
            </div>
            <span>ADD</span>
          </button>

          <Link
            href="/budgets"
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
              isBudgets ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon icon="solar:wallet-bold-duotone" className="text-xl sm:text-2xl" />
            <span>BUDGETS</span>
          </Link>
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
              isSetupRoot || isSettings ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon icon="solar:settings-bold-duotone" className="text-xl sm:text-2xl" />
            <span>SETUP</span>
          </Link>
        </div>
      </div>

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        accounts={accounts}
        saving={savingTransaction}
      />
    </div>
  );
}
