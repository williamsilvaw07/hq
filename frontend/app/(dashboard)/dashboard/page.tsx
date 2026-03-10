"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { fixedBillsTotal, loadFixedBills, type FixedBill } from "@/lib/fixed-expenses";

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
  const { workspaceId } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    setFixedBills(loadFixedBills(workspaceId ?? null));
  }, [workspaceId]);

  if (!workspaceId) {
    return null;
  }

  const refreshBudgets = useCallback(async () => {
    if (!workspaceId) return;
    const res = await api<BudgetSummary[]>(
      `/api/workspaces/${workspaceId}/budgets?with_summaries=true`,
    );
    setBudgets(Array.isArray(res.data) ? res.data : []);
  }, [workspaceId]);

  const periodExpense = dashboard?.period_expense ?? 0;
  const totalBudgetFromBudgets = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining || 0), 0);
  const monthlyFixedTotal = fixedBillsTotal(fixedBills);
  const totalBudget = totalBudgetFromBudgets + monthlyFixedTotal;
  const percentSpent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20 tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="active:scale-95 transition-all outline-none">
            <img
              alt="William Silva"
              src="https://lh3.googleusercontent.com/a/ACg8ocKWNslgSbBlq9VRuPmMGTIiOWz2MhQWURhBTCiZaqiaMKEbJGg=s96-c"
              className="w-10 h-10 rounded-full object-cover grayscale border border-white/10"
            />
          </button>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Budget Tracker
            </p>
            <p className="text-sm font-semibold text-foreground">Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border/50 text-foreground transition-all active:scale-95">
            <span className="text-xs text-muted-foreground">⚙️</span>
          </button>
        </div>
      </header>
      <main className="px-6 space-y-8">
        <section className="flex flex-col items-center justify-center pt-6 pb-2">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2 opacity-60">
            Total Spent this Month
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-xl font-light text-muted-foreground/50 tracking-tighter">$</span>
            <h1 className="text-5xl font-heading font-black tracking-tighter text-foreground">
              {periodExpense.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h1>
          </div>
          <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                style={{ width: `${percentSpent}%` }}
                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              />
            </div>
            <div className="flex justify-between w-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>Spent {percentSpent.toFixed(0)}%</span>
              <span>
                Budget: $
                {totalBudget.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground tracking-tight">Active Budgets</h2>
            <Link
              href="/budgets"
              className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {budgets.map((b) => {
              const remaining = Number(b.remaining || 0);
              const amount = Number(b.amount || 0);
              const pct = amount > 0 ? Math.min(100, (amount - remaining) / amount * 100) : 0;
              const label =
                b.period_type === "week"
                  ? "Weekly"
                  : b.period_type === "month" && (b.period_interval ?? 1) === 3
                  ? "Every 3 Months"
                  : "Monthly";

              return (
                <div
                  key={b.id}
                  className="bg-card p-5 rounded-[2.5rem] space-y-4 group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-2xl">
                        {b.category?.icon || "🍕"}
                      </div>
                      <div>
                        <h4 className="text-base font-bold">
                          {b.category?.name ?? "Budget"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          {label} • Resets {b.next_reset_date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold">
                        $
                        {remaining.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-muted-foreground font-medium">left</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                        of $
                        {amount.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <Link
                        href={`/budgets/${b.id}/edit`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-secondary/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!workspaceId) return;
                          if (typeof window !== "undefined") {
                            const ok = window.confirm(
                              "Delete this budget? This cannot be undone.",
                            );
                            if (!ok) return;
                          }
                          try {
                            await api(`/api/workspaces/${workspaceId}/budgets/${b.id}`, {
                              method: "DELETE",
                            });
                            await refreshBudgets();
                          } catch {
                            // ignore for now
                          }
                        }}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-chart-2/10 text-[9px] font-black uppercase tracking-widest text-chart-2 hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-orange-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-foreground tracking-tight">Fixed Bills</h2>
            <Link
              href="/settings/fixed-expenses"
              className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="bg-card/50 p-4 rounded-[1.8rem] flex items-center justify-between group active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground text-xl">🏠</span>
              </div>
              <div>
                <p className="text-sm font-bold">
                  Monthly Fixed Bills
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  Total this month
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-foreground">
              $
              {monthlyFixedTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
