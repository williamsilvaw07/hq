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
import { TransactionModal } from "../transactions/TransactionModal";
import { BudgetModal } from "../budgets/BudgetModal";

type DashboardData = {
  period_expense?: number;
};

type BudgetSummary = {
  id: number;
  name?: string | null;
  icon?: string | null;
  amount: number;
  spent: number;
  remaining: number;
  spent_percentage: number;
  period_type?: string;
  period_interval?: number;
  next_reset_date: string;
  category?: { id: number; name: string; icon?: string | null };
};

type Category = { id: number; name: string; type: string; icon?: string | null };

type Transaction = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  status: string;
  category?: { id: number; name: string };
  account?: { id: number; name: string } | null;
};

export default function DashboardPage() {
  const { user, workspaceId } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal states
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const prev = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") document.title = "Dashboard | Budget Tracker";
    return () => {
      if (typeof document !== "undefined") document.title = prev || "Budget Tracker";
    };
  }, [workspaceId]);

  const fetchData = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api<DashboardData>(`/api/workspaces/${workspaceId}/dashboard?period=this_month`)
        .then((r) => r.data ?? { period_expense: 0 }),
      api<BudgetSummary[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`).then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
      api<FixedBill[]>(`/api/workspaces/${workspaceId}/fixed-bills`)
        .then((r) => Array.isArray(r.data) ? r.data : []),
      api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
        .then((r) => Array.isArray(r.data) ? r.data : []),
      api<any>(`/api/workspaces/${workspaceId}/accounts`)
        .then((r) => r.data?.accounts || []),
      api<any>(`/api/workspaces/${workspaceId}/transactions?per_page=5&page=1`)
        .then((r) => Array.isArray(r.data?.data) ? r.data.data : []),
    ])
      .then(([d, b, f, cat, acc, txs]) => {
        setDashboard(d);
        setBudgets(b);
        setFixedBills(f);
        setCategories(cat);
        setAccounts(acc);
        setRecentTransactions(txs);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load dashboard.");
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global event for bottom nav ADD button
  useEffect(() => {
    const handleOpenAdd = () => {
      setTransactionModalOpen(true);
    };
    window.addEventListener("open-add-transaction", handleOpenAdd);
    return () => window.removeEventListener("open-add-transaction", handleOpenAdd);
  }, []);

  async function handleSaveBudget(data: any) {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const isEdit = !!editingBudget;
      const url = isEdit
        ? `/api/workspaces/${workspaceId}/budgets/${editingBudget.id}`
        : `/api/workspaces/${workspaceId}/budgets`;
      await api(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({ ...data, currency: "BRL" }),
      });
      fetchData();
      setBudgetModalOpen(false);
      setEditingBudget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTransaction(data: any) {
    if (!workspaceId) return;
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      fetchData();
      setTransactionModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!workspaceId) return null;

  const variableLimit = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const variableSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const monthlyFixedTotal = fixedBillsTotal(fixedBills);
  const projectedMonthlySpending = monthlyFixedTotal + variableLimit;
  const variablePercent = variableLimit > 0 ? Math.min(100, (variableSpent / variableLimit) * 100) : 0;

  const today = new Date();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const totalMonthDays = monthEnd.getDate();
  const daysPassed = today.getDate();
  const daysLeft = totalMonthDays - daysPassed;
  const monthProgressPercent = (daysPassed / totalMonthDays) * 100;

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-6 rounded-xl text-center space-y-4">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <button onClick={fetchData} className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">Retry</button>
        </div>
      </div>
    );
  }

  const activeBudgets = budgets.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/profile" className="active:scale-95 transition-all">
            <img
              alt={user?.name ?? "User"}
              src={user?.avatar_url ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
              className="w-9 h-9 rounded-full object-cover grayscale border border-white/10"
            />
          </Link>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-60">Overview</p>
            <p className="text-sm font-bold text-foreground">Welcome back</p>
          </div>
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground">
          <Icon icon="solar:notification-lines-duotone" className="text-xl" />
        </button>
      </header>

      <main className="px-6 space-y-8 mt-2">
        <section className="bg-card p-6 rounded-xl relative overflow-hidden group shadow-2xl shadow-black/10">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4 opacity-50">Projected Monthly Spending</p>
          <div className="flex items-baseline gap-2 mb-6 text-foreground">
            <span className="text-2xl font-light text-muted-foreground/30 leading-none">{CURRENCY_SYMBOL}</span>
            <h2 className="text-5xl font-black tracking-tighter leading-none">
              {formatBRLocale(projectedMonthlySpending, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="space-y-4">
            <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
              <div style={{ width: `${monthProgressPercent}%` }} className="h-full bg-white rounded-full transition-all duration-1000" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
              <span className="flex items-center gap-1.5">
                <Icon icon="solar:calendar-bold-duotone" className="text-xs text-white/40" />
                Ends {monthEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
              <span>{daysLeft} days left • {monthProgressPercent.toFixed(0)}%</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3.5">
          <div className="bg-card p-4 rounded-xl flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-50">Variable</p>
              <p className="text-2xl font-black tracking-tighter">
                {CURRENCY_SYMBOL} {formatBRLocale(variableSpent, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <div style={{ width: `${variablePercent}%` }} className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{variablePercent.toFixed(0)}% of {formatCompact(variableLimit)}</p>
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-50">Fixed Bills</p>
              <p className="text-2xl font-black tracking-tighter text-chart-1">
                {CURRENCY_SYMBOL} {formatBRLocale(monthlyFixedTotal, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <div style={{ width: "100%" }} className="h-full bg-chart-1 rounded-full shadow-[0_0_12px_rgba(var(--chart-1),0.3)]" />
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">100% committed</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Active Budgets</h2>
            <Link href="/budgets" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">Manage All</Link>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            {activeBudgets.map((budget) => (
              <div
                key={budget.id}
                onClick={() => {
                  setEditingBudget(budget);
                  setBudgetModalOpen(true);
                }}
                className="bg-card p-5 rounded-xl flex flex-col gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-border/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {budget.icon || budget.category?.icon || "💰"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{budget.name || budget.category?.name || "Budget"}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                        {budget.period_type ?? "Monthly"} • {budget.next_reset_date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{CURRENCY_SYMBOL} {formatBRLocale(budget.remaining, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">left of {formatCompact(budget.amount)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: budget.spent_percentage > 0 ? `${Math.max(budget.spent_percentage, 2)}%` : "0%" }}
                      className={`h-full rounded-full transition-all duration-700 ${budget.spent_percentage >= 90 ? "bg-chart-2" : budget.spent_percentage >= 70 ? "bg-yellow-400" : "bg-white"}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-50">
                    {budget.spent_percentage.toFixed(0)}% used • {CURRENCY_SYMBOL} {formatBRLocale(budget.spent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} spent
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Recent Transactions</h2>
            <Link href="/transactions" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">See All</Link>
          </div>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border/5">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 opacity-50">No transactions yet.</p>
            ) : (
              recentTransactions.map((tx) => {
                const isExpense = tx.type === "expense";
                const dateLabel = new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                return (
                  <Link
                    key={tx.id}
                    href={`/transactions/${tx.id}`}
                    className="flex items-center justify-between px-5 py-4 active:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-base shrink-0">
                        {isExpense ? "↓" : "↑"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {tx.description || tx.category?.name || "Transaction"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 mt-0.5">
                          {dateLabel} • {tx.account?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-black tracking-tight shrink-0 ${isExpense ? "text-foreground" : "text-chart-1"}`}>
                      {isExpense ? "-" : "+"}{CURRENCY_SYMBOL} {formatBRLocale(tx.amount, { minimumFractionDigits: 2 })}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        initialData={editingBudget}
        categories={categories}
        saving={saving}
      />

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={budgets.map((b) => ({ id: b.category?.id ?? (b as any).categoryId, name: b.name || b.category?.name || "Budget", type: "expense" }))}
        accounts={accounts}
        saving={saving}
      />
    </div>
  );
}
