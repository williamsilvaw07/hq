"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  fixedBillsTotal,
  type FixedBill,
} from "@/lib/fixed-expenses";
import { CURRENCY_SYMBOL, formatBRLocale, formatCompact } from "@/lib/format";

type DashboardData = {
  period_expense?: number;
};

type BudgetSummary = {
  id: number;
  amount: number;
  spent: number;
  remaining: number;
  spent_percentage: number;
  period_type?: string;
  period_interval?: number;
  next_reset_date: string;
  category?: { id: number; name: string; icon?: string | null };
};

export default function DashboardPage() {
  const { user, workspaceId } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const prev = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") document.title = "Dashboard | Budget Tracker";
    return () => {
      if (typeof document !== "undefined") document.title = prev || "Budget Tracker";
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api<DashboardData>(`/api/workspaces/${workspaceId}/dashboard?period=this_month`)
        .then((r) => r.data ?? { period_expense: 0 }),
      api<BudgetSummary[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`).then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
    ])
      .then(([d, b]) => {
        setDashboard(d);
        setBudgets(b);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load dashboard. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    api<FixedBill[]>(`/api/workspaces/${workspaceId}/fixed-bills`)
      .then((r) => setFixedBills(Array.isArray(r.data) ? r.data : []))
      .catch(() => setFixedBills([]));
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onRefresh = () => {
      if (!workspaceId) return;
      api<FixedBill[]>(`/api/workspaces/${workspaceId}/fixed-bills`)
        .then((r) => setFixedBills(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
    };
    window.addEventListener("fixed-bills-refresh", onRefresh);
    return () => window.removeEventListener("fixed-bills-refresh", onRefresh);
  }, [workspaceId]);

  const retryLoad = useCallback(() => {
    if (!workspaceId) return;
    setLoadError(null);
    setLoading(true);
    Promise.all([
      api<DashboardData>(`/api/workspaces/${workspaceId}/dashboard?period=this_month`)
        .then((r) => r.data ?? { period_expense: 0 }),
      api<BudgetSummary[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`).then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
    ])
      .then(([d, b]) => {
        setDashboard(d);
        setBudgets(b);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load dashboard. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (!workspaceId) {
    return null;
  }

  const periodExpense = dashboard?.period_expense ?? 0;
  const variableLimit = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const variableSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const monthlyFixedTotal = fixedBillsTotal(fixedBills);
  const totalBudget = variableLimit + monthlyFixedTotal;
  const totalSpent = periodExpense + monthlyFixedTotal;
  const percentSpent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  const variablePercent = variableLimit > 0 ? Math.min(100, (variableSpent / variableLimit) * 100) : 0;

  if (loadError) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-32 font-sans flex flex-col items-center justify-center px-4">
        <div className="bg-card/50 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <h2 className="text-lg font-bold text-foreground">Unable to load dashboard</h2>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <p className="text-xs text-muted-foreground">
            This may be a temporary server issue. If it persists, please contact support.
          </p>
          <button
            type="button"
            onClick={retryLoad}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20 tracking-tight">
      <header className="z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/profile" className="active:scale-95 transition-all outline-none">
            <img
              alt={user?.name ?? "User"}
              src={user?.avatar_url ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
              className="w-9 h-9 rounded-full object-cover grayscale border border-white/10"
            />
          </Link>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-widest">
              Budget Tracker
            </p>
            <p className="text-xs font-medium text-foreground">Overview</p>
          </div>
        </div>
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border/50 text-foreground transition-all active:scale-95"
          aria-label="Notifications"
        >
          <Icon icon="solar:notification-lines-duotone" className="text-lg text-muted-foreground" />
        </button>
      </header>

      <main className="px-6 space-y-8">
        {/* Total Spent This Month - Overview */}
        <section className="flex flex-col items-center justify-center pt-4 pb-2">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mb-2">
            Total Spent This Month
          </p>
          <div className="flex flex-col items-center gap-1 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-light text-muted-foreground/70 tracking-tighter">
                {CURRENCY_SYMBOL}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground">
                {formatBRLocale(totalSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2.5 w-full max-w-[280px]">
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                style={{ width: `${percentSpent}%` }}
                className="h-full bg-white/80 rounded-full transition-all duration-300"
              />
            </div>
            <div className="flex justify-between w-full text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
              <span>{percentSpent.toFixed(0)}% Spent</span>
              <span>
                Budget: {CURRENCY_SYMBOL} {formatBRLocale(totalBudget, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </section>

        {/* Variable Budgets & Fixed Bills Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/budgets"
            className="bg-card p-4 sm:p-5 rounded-2xl border border-border/50 shadow-lg shadow-black/5 hover:border-border/80 transition-all active:scale-[0.99] block"
          >
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-3">
              Variable Budgets
            </p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-sm text-muted-foreground/80">{CURRENCY_SYMBOL}</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tighter">
                {formatBRLocale(variableSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
              <div
                style={{ width: `${variablePercent}%` }}
                className="h-full bg-white/80 rounded-full transition-all duration-300"
              />
            </div>
            <div className="flex justify-between text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
              <span>{variablePercent.toFixed(0)}% Spent</span>
              <span>Limit: {formatCompact(variableLimit)}</span>
            </div>
          </Link>

          <Link
            href="/settings/fixed-expenses"
            className="bg-card p-4 sm:p-5 rounded-2xl border border-border/50 shadow-lg shadow-black/5 hover:border-border/80 transition-all active:scale-[0.99] block"
          >
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-3">
              Fixed Bills
            </p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-sm text-muted-foreground/80">{CURRENCY_SYMBOL}</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tighter">
                {formatBRLocale(monthlyFixedTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
              <div
                style={{ width: monthlyFixedTotal > 0 ? "100%" : "0%" }}
                className="h-full bg-white/80 rounded-full transition-all duration-300"
              />
            </div>
            <div className="flex justify-between text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
              <span>{monthlyFixedTotal > 0 ? "Fully Paid" : "No Bills"}</span>
              <span>Total: {formatCompact(monthlyFixedTotal)}</span>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
