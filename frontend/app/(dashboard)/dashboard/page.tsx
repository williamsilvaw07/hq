"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
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
  const { workspaceId, setWorkspaceId } = useAuth();
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
        {/* Period filter + Balance hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card to-card/80 border border-border px-5 py-6 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
              <div
                className="flex rounded-xl bg-muted/80 p-1 gap-0.5"
                role="tablist"
                aria-label="Time period"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={period === opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      period === opt.value
                        ? "bg-background text-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Total Balance
            </p>
            <div
              className={`flex items-baseline gap-1 transition-opacity duration-200 ${loading ? "opacity-70" : "opacity-100"}`}
            >
              <h1 className="text-5xl font-heading font-bold tracking-tighter">
                {formatMoneyBRL(displayData.net_position)}
              </h1>
            </div>
            {hasPeriodActivity && (
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Net change {periodLabel(period)}:{" "}
                <span className={periodNetChange >= 0 ? "text-chart-1" : "text-chart-2"}>
                  {periodNetChange >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(periodNetChange))}
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:border-chart-1/30 hover:shadow-md active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-chart-1/15 flex items-center justify-center ring-1 ring-chart-1/20">
              <ArrowUpRight className="w-5 h-5 text-chart-1" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                INCOME
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatMoney(periodIncome)}
              </p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:border-chart-2/30 hover:shadow-md active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-chart-2/15 flex items-center justify-center ring-1 ring-chart-2/20">
              <ShoppingBag className="w-5 h-5 text-chart-2" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                EXPENSES
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatMoney(periodExpense)}
              </p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:border-primary/30 hover:shadow-md active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Repeat className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Fixed expenses
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatMoney(fixedBillsTotal(fixedBills))}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {fixedBillsCount(fixedBills)} active bill{fixedBillsCount(fixedBills) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">
                Monthly Budgets
              </h2>
              <Link
                href="/budgets"
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                EDIT LIMITS
              </Link>
            </div>
            <div className="space-y-4">
              {budgets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-10 px-4 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-foreground">No budgets set</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Set spending limits by category to track your progress.
                  </p>
                  <Link
                    href="/budgets"
                    className="text-xs font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    Set up budgets →
                  </Link>
                </div>
              ) : (
                budgets.slice(0, 4).map((b, i) => {
                  const spent = 0;
                  const pct =
                    b.amount > 0
                      ? Math.min(100, (spent / b.amount) * 100)
                      : 0;
                  const isOrange = i % 2 === 0;
                  const Icon = isOrange ? ShoppingBag : Car;
                  return (
                    <div
                      key={b.id}
                      className="bg-secondary/80 border border-border p-4 rounded-2xl transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              isOrange
                                ? "w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center"
                                : "w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center"
                            }
                          >
                            <Icon
                              className={
                                isOrange
                                  ? "w-3.5 h-3.5 text-orange-500"
                                  : "w-3.5 h-3.5 text-blue-500"
                              }
                            />
                          </div>
                          <span className="text-xs font-bold">
                            {b.category?.name ?? "Category"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {sym} {formatMoneyShort(spent)}{" "}
                          <span className="text-muted-foreground font-medium">
                            / {formatMoneyShort(b.amount)}
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={
                            isOrange
                              ? "h-full bg-orange-500 rounded-full"
                              : "h-full bg-blue-500 rounded-full"
                          }
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-foreground">
                Credit Card Usage
              </h2>
              <Link
                href="/accounts"
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                MANAGE CARDS
              </Link>
            </div>
            <div className="relative -mx-6 px-6">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar">
                {displayData.credit_usage.length === 0 ? (
                  <div className="min-w-full snap-center rounded-2xl border border-dashed border-border bg-muted/30 py-10 px-4 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-muted-foreground" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-foreground">No credit cards</p>
                    <p className="text-xs text-muted-foreground max-w-[220px]">
                      Add accounts to see usage and limits here.
                    </p>
                    <Link
                      href="/accounts"
                      className="text-xs font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Add cards →
                    </Link>
                  </div>
                ) : (
                displayData.credit_usage.map((c, i) => {
                  const total = c.available + c.used;
                  const pct = total > 0 ? (c.used / total) * 100 : 0;
                  const isAmber = i % 2 === 0;
                  const dueLabel = c.next_reset ? dueInDays(c.next_reset) : null;
                  const lastFour = c.last_four && c.last_four.length === 4 ? c.last_four : "••••";
                  return (
                    <div
                      key={i}
                      className="min-w-[280px] snap-center snap-always bg-card border border-border p-5 rounded-3xl flex flex-col gap-4 shrink-0 shadow-lg transition-shadow hover:shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isAmber ? "bg-amber-500/10" : "bg-blue-500/10"
                            }`}
                          >
                            <CreditCard
                              className={`text-xl ${
                                isAmber ? "text-amber-500" : "text-blue-500"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {c.name ?? `Card ${i + 1}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              **** {lastFour}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {dueLabel ? (
                            <p className="text-[10px] text-destructive font-bold uppercase">
                              {dueLabel}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                              —
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-lg font-bold text-foreground">
                            {formatMoney(c.used)}{" "}
                            <span className="text-xs text-muted-foreground font-medium">
                              / {formatMoneyShort(c.available + c.used)}
                            </span>
                          </p>
                        </div>
                        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, pct)}%` }}
                            className={`h-full rounded-full ${
                              isAmber ? "bg-amber-500" : "bg-blue-500"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1.5">
                          {pct.toFixed(0)}% used
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
              {/* Scroll fade hint when there are cards */}
              {displayData.credit_usage.length > 1 && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent" aria-hidden />
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">
              Recent Activity
            </h2>
            <Link
              href="/transactions"
              className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              SEE ALL
            </Link>
          </div>
          <div className="space-y-2">
            {displayData.recent_transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-10 px-4 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Your income and expenses for this period will appear here.
                </p>
                <Link
                  href="/transactions/new"
                  className="text-xs font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Add transaction →
                </Link>
              </div>
            ) : (
              displayData.recent_transactions.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-2xl bg-card border border-border transition-all hover:bg-secondary/80 hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        t.type === "income"
                          ? "bg-chart-1/10 ring-1 ring-chart-1/20"
                          : "bg-muted ring-1 ring-border/50"
                      }`}
                    >
                      {t.type === "income" ? (
                        <ArrowUpRight className="w-5 h-5 text-chart-1" aria-hidden />
                      ) : (
                        <Store className="w-5 h-5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t.description || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {t.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        t.type === "income"
                          ? "text-chart-1"
                          : "text-foreground"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatMoney(Math.abs(t.amount))}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatRelativeDay(t.date)}
                    </span>
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
