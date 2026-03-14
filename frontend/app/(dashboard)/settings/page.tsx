"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Wallet,
  ChevronRight,
  Calendar,
  Home,
  LogOut,
  Users,
  Send,
  Copy,
  CheckCheck,
} from "lucide-react";
import { type FixedBill } from "@/lib/fixed-expenses";
import { formatMoney } from "@/lib/format";

function TelegramLinkSection() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const r = await api<{ code: string }>("/api/telegram/link", { method: "POST" });
      if (r.data?.code) setCode(r.data.code);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
        Integrations
      </h3>
      <div className="bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
        <div className="p-3 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold">Connect Telegram</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Log expenses by sending messages to your bot
              </p>
            </div>
          </div>

          {!code ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Linking Code"}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground">
                Send this code to your Telegram bot. Expires in 15 minutes.
              </p>
              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-3">
                <span className="text-xl font-mono font-bold tracking-widest text-foreground">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-muted-foreground active:scale-90 transition-all"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <CheckCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"
              >
                {loading ? "Generating..." : "Generate New Code"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

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
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
        Workspace
      </h3>
      <div className="bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
        {/* Current workspace → goes to its settings (currency, members, etc.) */}
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
                <p className="text-[10px] text-muted-foreground font-medium">
                  Currency, members &amp; settings
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
        {/* Switch workspace */}
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
              <p className="text-[10px] text-muted-foreground font-medium">
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
  const { user, logout, workspaceId } = useAuth();
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);

  const refreshFixedBills = useCallback(() => {
    if (!workspaceId) return;
    api<FixedBill[]>(`/api/workspaces/${workspaceId}/fixed-bills`)
      .then((r) => setFixedBills(Array.isArray(r.data) ? r.data : []))
      .catch(() => setFixedBills([]));
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
    <div className="space-y-5 sm:space-y-8 pt-2 sm:pt-4 px-4 sm:px-6">
      {/* Profile card */}
      <section className="flex flex-col items-center py-4 sm:py-6 bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center text-xl sm:text-2xl font-bold text-foreground">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <h2 className="text-lg sm:text-xl font-bold mt-3 sm:mt-4">{user?.name ?? "User"}</h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5 sm:mt-1 uppercase tracking-widest">
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
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
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
                <p className="text-[10px] text-muted-foreground font-medium">Set category limits</p>
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
                <p className="text-[10px] text-muted-foreground font-medium">Manage recurring bills</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Active Bills — inline under Fixed Expenses */}
        <div className="bg-secondary rounded-lg sm:rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-4 pb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Active Bills</p>
            <Link
              href="/settings/fixed-expenses"
              className="text-[10px] font-bold text-primary uppercase tracking-widest"
            >
              + Add New
            </Link>
          </div>
          {fixedBills.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 sm:px-5 pb-4">
              No fixed expenses yet.
            </p>
          ) : (
            <div className="divide-y divide-border/30">
              {fixedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-background flex items-center justify-center shrink-0">
                      {bill.icon ? (
                        <span className="text-lg">{bill.icon}</span>
                      ) : (
                        <Home className="w-5 h-5 text-muted-foreground" />
                      )}
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
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Workspace */}
      <WorkspaceSettingsSection />

      {/* Telegram */}
      <TelegramLinkSection />


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
