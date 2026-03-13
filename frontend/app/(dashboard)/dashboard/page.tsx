"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  fixedBillsTotal,
  loadFixedBills,
  computeNextOccurrence,
  type FixedBill,
} from "@/lib/fixed-expenses";
import { CURRENCY_SYMBOL, formatBRLocale } from "@/lib/format";

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

const BUDGET_CARD_COLORS = [
  { bg: "bg-orange-500/10", border: "border-orange-500/20", bar: "bg-orange-500", icon: "text-orange-500" },
  { bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500", icon: "text-blue-500" },
  { bg: "bg-purple-500/10", border: "border-purple-500/20", bar: "bg-purple-500", icon: "text-purple-500" },
];

const DEFAULT_ICON = "solar:wallet-bold-duotone";

function daysUntilReset(nextResetDate: string): number | null {
  if (!nextResetDate?.trim()) return null;
  const s = nextResetDate.trim();
  let date: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    date = new Date(s.slice(0, 10) + "T00:00:00");
  } else {
    const parts = s.split(/[/-]/);
    if (parts.length >= 3) {
      const y = parseInt(parts[2]?.replace(/\D/g, "") || "0", 10);
      const m = parseInt(parts[1]?.replace(/\D/g, "") || "0", 10) - 1;
      const d = parseInt(parts[0]?.replace(/\D/g, "") || "0", 10);
      if (y && m >= 0 && d) date = new Date(y, m, d);
    }
  }
  if (!date || isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

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
    setFixedBills(loadFixedBills(workspaceId ?? null));
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

  const refreshBudgets = useCallback(async () => {
    if (!workspaceId) return;
    const res = await api<BudgetSummary[]>(
      `/api/workspaces/${workspaceId}/budgets?with_summaries=true`,
    );
    setBudgets(Array.isArray(res.data) ? res.data : []);
  }, [workspaceId]);

  if (!workspaceId) {
    return null;
  }

  const periodExpense = dashboard?.period_expense ?? 0;
  const totalBudgetFromBudgets = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const monthlyFixedTotal = fixedBillsTotal(fixedBills);
  const totalBudget = totalBudgetFromBudgets + monthlyFixedTotal;
  const totalSpent = periodExpense + monthlyFixedTotal;
  const percentSpent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  const firstBill = fixedBills[0];
  const nextDue = firstBill ? computeNextOccurrence(firstBill) : null;
  const daysUntilDue =
    nextDue ? Math.ceil((nextDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const showSingleBill = fixedBills.length === 1 && firstBill;

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
            <Icon icon="solar:notification-lines-duotone" className="text-lg text-muted-foreground" />
          </button>
        </div>
      </header>
      <main className="px-6 space-y-8">
        <section className="flex flex-col items-center justify-center pt-4 pb-2">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mb-2 opacity-60">
            Total Spent this Month
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-xl font-light text-muted-foreground/50 tracking-tighter">
              {CURRENCY_SYMBOL}
            </span>
            <h1 className="text-5xl font-heading font-semibold tracking-tighter">
              {formatBRLocale(totalSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
          <div className="flex flex-col items-center gap-2.5 w-full max-w-[240px]">
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                style={{ width: `${percentSpent}%` }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
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
            {budgets.map((b, i) => {
              const remaining = Number(b.remaining || 0);
              const amount = Number(b.amount || 0);
              const pct = amount > 0 ? Math.min(100, ((amount - remaining) / amount) * 100) : 0;
              const label =
                b.period_type === "week"
                  ? "Weekly"
                  : b.period_type === "month" && (b.period_interval ?? 1) === 3
                    ? "Quarterly"
                    : "Monthly";
              const daysLeft = daysUntilReset(b.next_reset_date);
              const sublabel =
                daysLeft != null
                  ? `${label} • ${daysLeft} days left`
                  : `${label} • Resets ${b.next_reset_date}`;
              const colors = BUDGET_CARD_COLORS[i % BUDGET_CARD_COLORS.length];
              const iconId =
                typeof b.category?.icon === "string" && b.category.icon.trim().length > 0
                  ? b.category.icon
                  : DEFAULT_ICON;

              return (
                <Link
                  key={b.id}
                  href={`/budgets/${b.id}/edit`}
                  className="bg-card p-4 rounded-[1.8rem] border border-border/50 space-y-3.5 group active:scale-[0.98] transition-all block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors.bg} ${colors.border}`}
                      >
                        <Icon icon={iconId} className={`text-xl ${colors.icon}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{b.category?.name ?? "Budget"}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">
                          {sublabel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {CURRENCY_SYMBOL} {formatBRLocale(remaining, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          left
                        </span>
                      </p>
                      <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest">
                        of {CURRENCY_SYMBOL} {formatBRLocale(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${colors.bar} rounded-full`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

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
          <Link
            href="/settings/fixed-expenses"
            className="bg-card/50 p-3.5 rounded-2xl border border-border/30 flex items-center justify-between group active:scale-[0.98] transition-all block"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Icon icon="solar:home-2-bold-duotone" className="text-muted-foreground text-base" />
              </div>
              <div>
                <p className="text-xs font-semibold">
                  {showSingleBill ? firstBill!.name : "Monthly Fixed Bills"}
                </p>
                <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest">
                  {showSingleBill && daysUntilDue != null && daysUntilDue >= 0
                    ? `Due in ${daysUntilDue} days`
                    : "Total this month"}
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-foreground">
              {CURRENCY_SYMBOL} {formatBRLocale(showSingleBill ? firstBill!.amount : monthlyFixedTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
