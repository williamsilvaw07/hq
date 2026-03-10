"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, buildMediaUrl } from "@/lib/api";
import {
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  Store,
  Car,
  Calendar,
  Receipt,
  TrendingUp,
  Repeat,
} from "lucide-react";
import { fixedBillsTotal, fixedBillsCount, loadFixedBills, type FixedBill } from "@/lib/fixed-expenses";
import { formatMoney as formatMoneyBRL } from "@/lib/format";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
] as const;
type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-32 font-sans dashboard-skeleton">
      <main className="px-6 space-y-8">
        <section className="flex flex-col items-center pt-4 pb-2">
          <div className="flex rounded-xl bg-muted/80 p-1 gap-0.5 mb-6 w-full max-w-[280px]">
            <div className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />
            <div className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />
            <div className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-24 rounded bg-muted animate-pulse mb-2" />
          <div className="h-14 w-48 rounded-lg bg-muted animate-pulse" />
        </section>
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl flex flex-col gap-3 h-[120px]">
            <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-2xl flex flex-col gap-3 h-[120px]">
            <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </section>
        <section className="space-y-6">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-secondary p-4 rounded-2xl h-20 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            <div className="min-w-[280px] h-40 rounded-3xl bg-muted animate-pulse shrink-0" />
            <div className="min-w-[280px] h-40 rounded-3xl bg-muted animate-pulse shrink-0" />
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/80 animate-pulse" />
                </div>
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

type DashboardCreditUsageItem = {
  name?: string;
  used: number;
  available: number;
  next_reset?: string;
  last_four?: string | null;
};

type DashboardData = {
  cash_bank_balance: number;
  credit_usage: DashboardCreditUsageItem[];
  net_position: number;
  period?: string;
  period_income?: number;
  period_expense?: number;
  monthly_income?: number;
  monthly_expense?: number;
  recent_transactions: Array<{
    id: number;
    type: string;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
    status: string;
  }>;
};

function formatRelativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const other = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - other.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return dateStr;
}

function dueInDays(dateStr: string): string | null {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due in 1d";
  return `Due in ${diff}d`;
}

type BudgetItem = {
  id: number;
  category_id: number;
  category?: { name: string };
  month: number;
  year: number;
  amount: number;
};


function periodLabel(value: PeriodValue): string {
  const o = PERIOD_OPTIONS.find((p) => p.value === value);
  return o ? o.label.toLowerCase() : "this month";
}

type Workspace = { id: number; name: string; slug: string };

function NoWorkspaceEmptyState({ setWorkspaceId }: { setWorkspaceId: (id: number) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter a workspace name.");
      return;
    }
    setCreating(true);
    try {
      const res = await api<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.data) {
        setWorkspaceId(res.data.id);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("workspaces-refresh"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div id="create-workspace" className="min-h-screen pb-32 font-sans flex flex-col items-center justify-center px-6 text-center pt-4 scroll-mt-24">
      <h1 className="text-lg font-bold text-foreground mb-2">Create your workspace</h1>
      <p className="text-xs text-muted-foreground max-w-[280px] mb-6">
        Create a workspace to start following your finances. Enter a name below and click <strong className="text-foreground">Create workspace</strong>.
      </p>
      <h2 className="sr-only">Create workspace</h2>
      <form onSubmit={handleCreate} className="w-full max-w-[280px] space-y-4 text-left">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-2xl p-3">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="workspace-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Personal"
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold text-sm shadow-lg shadow-white/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
        >
          {creating ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </div>
  );
}

export default function DashboardPage() {
  const { workspaceId, setWorkspaceId, user } = useAuth();
  const [period, setPeriod] = useState<PeriodValue>("this_month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") document.title = "Dashboard | Fintech Tracker";
    return () => {
      if (typeof document !== "undefined") document.title = prev || "Fintech Tracker";
    };
  }, []);

  const fetchDashboard = useCallback(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<DashboardData>(`/api/workspaces/${workspaceId}/dashboard?period=${period}`)
      .then((r) => {
        if (r.data) setData(r.data);
        else
          setData({
            cash_bank_balance: 0,
            credit_usage: [],
            net_position: 0,
            period_income: 0,
            period_expense: 0,
            recent_transactions: [],
          });
      })
      .catch(() =>
        setData({
          cash_bank_balance: 0,
          credit_usage: [],
          net_position: 0,
          period_income: 0,
          period_expense: 0,
          recent_transactions: [],
        })
      )
      .finally(() => setLoading(false));
  }, [workspaceId, period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!workspaceId) return;
    const now = new Date();
    api<BudgetItem[]>(
      `/api/workspaces/${workspaceId}/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
    )
      .then((r) => {
        if (Array.isArray(r.data)) setBudgets(r.data);
      })
      .catch(() => {});
  }, [workspaceId]);

  const refreshFixedBills = useCallback(() => {
    setFixedBills(loadFixedBills(workspaceId ?? null));
  }, [workspaceId]);

  useEffect(() => {
    refreshFixedBills();
  }, [refreshFixedBills]);

  useEffect(() => {
    const onRefresh = () => refreshFixedBills();
    window.addEventListener("fixed-bills-refresh", onRefresh);
    return () => window.removeEventListener("fixed-bills-refresh", onRefresh);
  }, [refreshFixedBills]);

  if (!workspaceId) {
    return (
      <NoWorkspaceEmptyState setWorkspaceId={setWorkspaceId} />
    );
  }

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const raw = data ?? {
    cash_bank_balance: 0,
    credit_usage: [],
    net_position: 0,
    period_income: 0,
    period_expense: 0,
    recent_transactions: [],
  };
  const displayData = {
    ...raw,
    credit_usage: Array.isArray(raw.credit_usage) ? raw.credit_usage : [],
    recent_transactions: Array.isArray(raw.recent_transactions) ? raw.recent_transactions : [],
  };

  const periodIncome = displayData.period_income ?? displayData.monthly_income ?? 0;
  const periodExpense = displayData.period_expense ?? displayData.monthly_expense ?? 0;

  const sym = "R$";
  const formatMoney = (n: number) => formatMoneyBRL(n);
  const formatMoneyShort = (n: number) =>
    n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const hasPeriodActivity = periodIncome + periodExpense > 0;
  const periodNetChange = periodIncome - periodExpense;

  return (
    <div className="min-h-screen pb-32 font-sans selection:bg-primary/20 tracking-tight">
      <main className="px-6 space-y-8">
        {/* Net balance hero */}
        <section className="flex flex-col items-center justify-center pt-6 pb-2">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2 opacity-60">
            Net Balance
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-2xl font-light text-muted-foreground/50 tracking-tighter">
              {sym}
            </span>
            <h1 className="text-6xl font-heading font-black tracking-tighter">
              {formatMoneyBRL(displayData.net_position).replace(sym, "")}
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-chart-1" aria-hidden />
              <span className="text-[11px] font-bold text-chart-1">
                {periodNetChange >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(periodNetChange))}
              </span>
            </div>
            <div className="w-px h-3 bg-white/10 mx-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {periodLabel(period)}
            </span>
          </div>
        </section>

        {/* Period selector */}
        <section className="bg-secondary/20 p-1 rounded-2xl flex">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                period === opt.value
                  ? "rounded-xl bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label.replace("This ", "")}
            </button>
          ))}
        </section>

        {/* Period income / expenses cards */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card p-5 rounded-[2rem] flex flex-col gap-4 active:scale-[0.98] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-chart-1/10 flex items-center justify-center border border-chart-1/20">
              <ArrowUpRight className="text-chart-1 text-2xl" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">
                Period Income
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {formatMoney(periodIncome)}
              </p>
            </div>
          </div>
          <div className="bg-card p-5 rounded-[2rem] flex flex-col gap-4 active:scale-[0.98] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-chart-2/10 flex items-center justify-center border border-chart-2/20">
              <ShoppingBag className="text-chart-2 text-2xl" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">
                Period Expenses
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {formatMoney(periodExpense)}
              </p>
            </div>
          </div>
        </section>

        {/* Recurring & Fixed + Credit usage */}
        <section className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Recurring &amp; Fixed
              </h2>
              <Link
                href="/settings/fixed-expenses"
                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
              >
                Details
              </Link>
            </div>
            <div className="space-y-3">
              <div className="bg-secondary/40 p-4 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                      <Store className="text-orange-500 text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Fixed Bills</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Fixed Monthly
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatMoney(fixedBillsTotal(fixedBills))}
                  </p>
                </div>
                <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full opacity-30" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-foreground tracking-tight">Credit Card Usage</h2>
              <Link
                href="/accounts"
                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
              >
                Manage
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
              {displayData.credit_usage.length === 0 ? (
                <div className="min-w-[280px] bg-card p-5 rounded-[2rem] border border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-3">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No credit cards</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Add cards to see usage and limits here.
                  </p>
                  <Link href="/accounts" className="text-xs font-bold text-primary hover:underline">
                    Add cards →
                  </Link>
                </div>
              ) : (
                displayData.credit_usage.map((c, i) => {
                  const total = c.available + c.used;
                  const pct = total > 0 ? (c.used / total) * 100 : 0;
                  const isAmber = i % 2 === 0;
                  const dueLabel = c.next_reset ? dueInDays(c.next_reset) : null;
                  return (
                    <div
                      key={i}
                      className="min-w-[280px] bg-card p-5 rounded-[2rem] flex flex-col gap-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              isAmber
                                ? "bg-amber-500/10 border-amber-500/20"
                                : "bg-blue-500/10 border-blue-500/20"
                            }`}
                          >
                            <CreditCard
                              className={`text-xl ${
                                isAmber ? "text-amber-500" : "text-blue-500"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground tracking-tight">
                              {c.name ?? `Card ${i + 1}`}
                            </p>
                          </div>
                        </div>
                        {dueLabel && (
                          <div className="px-2 py-0.5 bg-secondary rounded-md">
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                              {dueLabel}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-lg font-bold text-foreground tracking-tight">
                            {formatMoney(c.used)}{" "}
                            <span className="text-xs text-muted-foreground font-medium">
                              / {formatMoneyShort(total)}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {pct.toFixed(0)}% Used
                          </p>
                        </div>
                        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, pct)}%` }}
                            className={`h-full rounded-full ${
                              isAmber
                                ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-foreground tracking-tight">Recent Activity</h2>
            <Link
              href="/transactions"
              className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="space-y-1">
            {displayData.recent_transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 py-8 px-4 flex flex-col items-center justify-center gap-3 text-center">
                <Receipt className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Your income and expenses for this period will appear here.
                </p>
                <Link href="/transactions/new" className="text-xs font-bold text-primary hover:underline">
                  Add transaction →
                </Link>
              </div>
            ) : (
              displayData.recent_transactions.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 rounded-[1.8rem] transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center transition-all group-hover:bg-background">
                      {t.type === "income" ? (
                        <ArrowUpRight className="text-chart-1 text-xl" aria-hidden />
                      ) : (
                        <Store className="text-muted-foreground text-xl" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground tracking-tight">
                        {t.description || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                        {t.type === "income" ? "Income" : "Expense"} • {t.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold tracking-tight ${
                        t.type === "income" ? "text-chart-1" : "text-foreground"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatMoney(Math.abs(t.amount))}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {formatRelativeDay(t.date)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
