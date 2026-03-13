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

  const activeBudgets = budgets.slice(0, 3);
  const firstFixedBill = fixedBills[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20 tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border/50 text-foreground transition-all active:scale-95"
            aria-label="Notifications"
          >
            <Icon
              icon="solar:notification-lines-duotone"
              className="text-lg text-muted-foreground"
            />
          </button>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Variable Budgets & Fixed Bills summary cards */}
        <section className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-card p-4 rounded-[2rem] border border-border/40 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-60">
                Variable Budgets
              </p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-light text-muted-foreground/50">{CURRENCY_SYMBOL}</span>
                <p className="text-xl font-semibold tracking-tighter">
                  {formatBRLocale(variableSpent, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{ width: `${variablePercent}%` }}
                  className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                />
              </div>
              <div className="flex justify-between text-[8px] font-semibold text-muted-foreground uppercase tracking-tighter">
                <span>{variablePercent.toFixed(0)}% Spent</span>
                <span>Limit: {formatCompact(variableLimit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-[2rem] border border-border/40 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-60">
                Fixed Bills
              </p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-light text-muted-foreground/50">{CURRENCY_SYMBOL}</span>
                <p className="text-xl font-semibold tracking-tighter">
                  {formatBRLocale(monthlyFixedTotal, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{ width: monthlyFixedTotal > 0 ? "100%" : "0%" }}
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                />
              </div>
              <div className="flex justify-between text-[8px] font-semibold text-muted-foreground uppercase tracking-tighter">
                <span>{monthlyFixedTotal > 0 ? "Fully Paid" : "No Bills"}</span>
                <span>Total: {formatCompact(monthlyFixedTotal)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Budgets list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-foreground tracking-tight uppercase tracking-widest opacity-80">
              Active Budgets
            </h2>
            <Link
              href="/budgets"
              className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {activeBudgets.map((budget, index) => {
              const remaining = budget.remaining ?? Math.max(0, Number(budget.amount) - Number(budget.spent));
              const spentPercentage = Math.min(100, budget.spent_percentage || 0);
              const colors = [
                { bg: "bg-orange-500/10", border: "border-orange-500/20", bar: "bg-orange-500", icon: "solar:hamburger-food-bold-duotone" },
                { bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500", icon: "solar:bus-bold-duotone" },
                { bg: "bg-purple-500/10", border: "border-purple-500/20", bar: "bg-purple-500", icon: "solar:clapperboard-play-bold-duotone" },
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={budget.id}
                  className="bg-card p-4 rounded-[1.8rem] border border-border/50 space-y-3.5 group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color.bg} ${color.border}`}
                      >
                        <Icon icon={budget.category?.icon || color.icon} className={`${color.bar.replace("bg-", "text-")} text-xl`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{budget.category?.name ?? "Budget"}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">
                          {budget.period_type === "weekly"
                            ? "Weekly"
                            : budget.period_type === "quarterly"
                              ? "Quarterly"
                              : "Monthly"}
                          {budget.period_interval && budget.period_interval > 1
                            ? ` • Every ${budget.period_interval}`
                            : ""}{" "}
                          • Active
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {CURRENCY_SYMBOL}{" "}
                        {formatBRLocale(remaining, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          left
                        </span>
                      </p>
                      <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest">
                        of {CURRENCY_SYMBOL}{" "}
                        {formatBRLocale(budget.amount, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${100 - spentPercentage}%` }}
                      className={`h-full rounded-full ${color.bar}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fixed Bills highlight */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold text-foreground tracking-tight uppercase tracking-widest opacity-80">
              Fixed Bills
            </h2>
            <Link
              href="/settings/fixed-expenses"
              className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              See all
            </Link>
          </div>
          {firstFixedBill && (
            <div className="bg-card/50 p-3.5 rounded-2xl border border-border/30 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-base">
                    {firstFixedBill.icon ?? (
                      <Icon
                        icon="solar:home-2-bold-duotone"
                        className="text-muted-foreground text-base"
                      />
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold">{firstFixedBill.name}</p>
                  <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest">
                    Due {firstFixedBill.due}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {CURRENCY_SYMBOL}{" "}
                {formatBRLocale(firstFixedBill.amount, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="bg-card/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-1.5 flex items-center justify-between shadow-2xl shadow-black/50">
          <Link
            href="/dashboard"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-primary"
          >
            <Icon icon="solar:home-2-bold-duotone" className="text-xl" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Home</span>
          </Link>
          <Link
            href="/history"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="solar:history-bold-duotone" className="text-xl" />
            <span className="text-[8px] font-bold uppercase tracking-widest">History</span>
          </Link>
          <Link
            href="/transactions/new"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="hugeicons:add-01" className="text-xl" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Add</span>
          </Link>
          <Link
            href="/budgets"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="solar:wallet-bold-duotone" className="text-xl" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Budgets</span>
          </Link>
          <Link
            href="/settings"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="solar:settings-bold-duotone" className="text-xl" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Setup</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
