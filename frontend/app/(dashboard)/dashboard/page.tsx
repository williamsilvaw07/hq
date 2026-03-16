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
import { CURRENCY_SYMBOL, formatBRL, formatCompact } from "@/lib/format";
import { TransactionModal } from "../transactions/TransactionModal";
import { BudgetModal } from "../budgets/BudgetModal";
import { SkeletonBox } from "@/components/ui/Skeleton";

type DashboardData = {
  period_income?: number;
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
  const [creditCards, setCreditCards] = useState<{ id: number; name: string }[]>([]);
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
    if (typeof document !== "undefined") document.title = "Dashboard | NorthTrack";
    return () => {
      if (typeof document !== "undefined") document.title = prev || "NorthTrack";
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
      api<{ id: number; name: string }[]>(`/api/workspaces/${workspaceId}/credit-cards`)
        .then((r) => Array.isArray(r.data) ? r.data.map((c: any) => ({ id: c.id, name: c.name })) : []),
      api<any>(`/api/workspaces/${workspaceId}/transactions?per_page=5&page=1`)
        .then((r) => Array.isArray(r.data?.data) ? r.data.data : []),
    ])
      .then(([d, b, f, cat, acc, cards, txs]) => {
        setDashboard(d);
        setBudgets(b);
        setFixedBills(f);
        setCategories(cat);
        setAccounts(acc);
        setCreditCards(cards);
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
    const handleOpenAdd = () => setTransactionModalOpen(true);
    const handleRefresh = () => fetchData();
    window.addEventListener("open-add-transaction", handleOpenAdd);
    window.addEventListener("transactions-refresh", handleRefresh);
    return () => {
      window.removeEventListener("open-add-transaction", handleOpenAdd);
      window.removeEventListener("transactions-refresh", handleRefresh);
    };
  }, [fetchData]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-32 font-sans tracking-tight">
        <main className="px-5 space-y-8 pt-4">
          {/* Hero spending card */}
          <SkeletonBox className="h-40 w-full" />

          {/* 2-col mini cards */}
          <section className="grid grid-cols-2 gap-3.5">
            <SkeletonBox className="h-[150px]" />
            <SkeletonBox className="h-[150px]" />
          </section>

          {/* Budget list */}
          <section className="space-y-4">
            <div className="space-y-3.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <SkeletonBox className="w-12 h-12" />
                      <div className="space-y-2">
                        <SkeletonBox className="h-4 w-28" />
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <SkeletonBox className="h-4 w-20" />
                      <SkeletonBox className="h-3 w-14" />
                    </div>
                  </div>
                  <SkeletonBox className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </section>

          {/* Recent transactions */}
          <section className="space-y-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 bg-card rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SkeletonBox className="w-10 h-10 shrink-0" />
                    <div className="space-y-2 min-w-0 flex-1">
                      <SkeletonBox className="h-4 w-3/5" />
                      <SkeletonBox className="h-3 w-2/5" />
                    </div>
                  </div>
                  <SkeletonBox className="h-5 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const variableLimit = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const variableSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const monthlyFixedTotal = fixedBillsTotal(fixedBills);
  // Only count fixed bills whose due day has passed or is today
  const todayDay = new Date().getDate();
  const fixedBillsDueTotal = fixedBills
    .filter((b) => (b.dayOfMonth ?? 1) <= todayDay)
    .reduce((sum, b) => sum + b.amount, 0);
  const totalBudget = monthlyFixedTotal + variableLimit;
  const variablePercent = variableLimit > 0 ? Math.min(100, (variableSpent / variableLimit) * 100) : 0;
  const unbudgeted = Math.max(0, Number(dashboard?.period_expense ?? 0) - variableSpent);
  const periodExpense = Number(dashboard?.period_expense ?? 0);
  const periodIncome = Number(dashboard?.period_income ?? 0);
  const spentPercent = totalBudget > 0 ? Math.min(100, (periodExpense / totalBudget) * 100) : 0;

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
  const hasAnyData = periodExpense > 0 || periodIncome > 0 || totalBudget > 0 || recentTransactions.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans tracking-tight">
      <main className="px-5 space-y-8 mt-4">
        <section className="flex gap-3">
          {/* Spent This Month — main card */}
          <div className="flex-1 bg-card p-6 rounded-xl relative overflow-hidden shadow-2xl shadow-black/10">
            {hasAnyData ? (
              <>
                <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-[0.2em] mb-4 opacity-50">Spent This Month</p>
                <div className={`flex items-baseline gap-2 mb-2 ${periodExpense > 0 ? "text-foreground" : "text-muted-foreground/20"}`}>
                  <span className="text-2xl font-light leading-none">{CURRENCY_SYMBOL}</span>
                  <h2 className="text-5xl font-black tracking-tighter leading-none">
                    {formatBRL(periodExpense, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                {totalBudget > 0 && (
                  <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter opacity-40 mb-4">
                    of {CURRENCY_SYMBOL} {formatBRL(totalBudget, { minimumFractionDigits: 2 })} est. budget
                  </p>
                )}
                {periodIncome > 0 && (
                  <p className="text-[10px] text-chart-1/60 font-normal uppercase tracking-tighter mb-4">
                    +{CURRENCY_SYMBOL} {formatBRL(periodIncome, { minimumFractionDigits: 2 })} income
                  </p>
                )}
                <div className="space-y-4">
                  <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    {totalBudget > 0 && spentPercent > 0 && (
                      <div
                        style={{ width: `${spentPercent}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ${spentPercent >= 90 ? "bg-chart-2" : spentPercent >= 70 ? "bg-yellow-400" : "bg-white"}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-normal text-muted-foreground uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1.5">
                      <Icon icon="solar:calendar-bold-duotone" className="text-xs text-white/40" />
                      Ends {String(monthEnd.getDate()).padStart(2, "0")}/{String(monthEnd.getMonth() + 1).padStart(2, "0")}/{String(monthEnd.getFullYear()).slice(-2)}
                    </span>
                    <span>{daysLeft}d{totalBudget > 0 ? ` • ${spentPercent.toFixed(0)}%` : ""}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-[0.2em] mb-4 opacity-50">Spent This Month</p>
                <div className="flex items-baseline justify-center gap-2 mb-4 text-muted-foreground/20">
                  <span className="text-2xl font-light leading-none">{CURRENCY_SYMBOL}</span>
                  <h2 className="text-5xl font-black tracking-tighter leading-none">0.00</h2>
                </div>
                <p className="text-xs text-muted-foreground/40">Add a budget or record a transaction to get started</p>
              </div>
            )}
          </div>

          {/* Fixed Bills — narrow side card */}
          {hasAnyData && (
            <div className="w-[110px] shrink-0 bg-card p-3.5 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[8px] text-muted-foreground font-normal uppercase tracking-widest mb-1.5 opacity-50">Fixed Bills</p>
                <p className={`text-base font-black tracking-tighter leading-tight ${fixedBillsDueTotal > 0 ? "text-chart-1" : "text-muted-foreground/30"}`}>
                  {CURRENCY_SYMBOL} {formatBRL(fixedBillsDueTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1.5 mt-auto">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  {monthlyFixedTotal > 0 && (
                    <div
                      style={{ width: `${Math.max(Math.min(100, (fixedBillsDueTotal / monthlyFixedTotal) * 100), 2)}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${(fixedBillsDueTotal / monthlyFixedTotal) * 100 >= 90 ? "bg-chart-2" : (fixedBillsDueTotal / monthlyFixedTotal) * 100 >= 70 ? "bg-yellow-400" : "bg-chart-1"}`}
                    />
                  )}
                </div>
                <p className="text-[8px] text-muted-foreground font-normal uppercase tracking-tighter opacity-50">
                  {monthlyFixedTotal > 0 ? `of ${formatCompact(monthlyFixedTotal)}` : "No bills"}
                </p>
              </div>
            </div>
          )}
        </section>

        {hasAnyData && (
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-card p-3.5 rounded-xl flex flex-col justify-between min-h-[130px]">
            <div>
              <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-widest mb-1.5 opacity-50">Budgets</p>
              <p className={`text-xl font-black tracking-tighter ${variableLimit === 0 ? "text-muted-foreground/30" : ""}`}>
                {CURRENCY_SYMBOL} {formatBRL(variableSpent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                {variableLimit > 0 && (
                  <div
                    style={{ width: `${Math.max(variablePercent, 2)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${variablePercent >= 90 ? "bg-chart-2" : variablePercent >= 70 ? "bg-yellow-400" : "bg-white"}`}
                  />
                )}
              </div>
              <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-tighter opacity-60">
                {variableLimit > 0 ? `${variablePercent.toFixed(0)}% of ${formatCompact(variableLimit)}` : "No budgets"}
              </p>
            </div>
          </div>
          <Link href="/transactions?budget=unbudgeted" className="bg-card p-3.5 rounded-xl flex flex-col justify-between min-h-[130px] active:scale-[0.98] transition-all">
            <div>
              <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-widest mb-1.5 opacity-50">Unbudgeted</p>
              <p className={`text-xl font-black tracking-tighter ${unbudgeted > 0 ? "text-orange-400" : "text-muted-foreground/30"}`}>
                {CURRENCY_SYMBOL} {formatBRL(unbudgeted, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-tighter opacity-60 mt-auto">
              {unbudgeted > 0 ? "No limit set" : "None"}
            </p>
          </Link>
        </section>
        )}

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/goals"
            className="flex items-center gap-3 p-3.5 bg-card rounded-xl active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <p className="text-xs font-bold">Goals</p>
              <p className="text-[9px] text-muted-foreground/40">Track progress</p>
            </div>
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-3 p-3.5 bg-card rounded-xl active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <p className="text-xs font-bold">History</p>
              <p className="text-[9px] text-muted-foreground/40">By month</p>
            </div>
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] opacity-50">Active Budgets</h2>
            <Link href="/budgets" className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">Manage All</Link>
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
                      <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest opacity-60">
                        {budget.period_type ?? "Monthly"} • {budget.next_reset_date}
                      </p>
                      {(budget as any).credit_card_name && (
                        <p className="text-[9px] text-muted-foreground/40 font-normal uppercase tracking-widest mt-0.5">
                          💳 {(budget as any).credit_card_name}
                          {(budget as any).credit_card_due_day && (() => {
                            const dueDay = (budget as any).credit_card_due_day;
                            const now = new Date();
                            const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);
                            const target = thisMonth > now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
                            const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            return <span className={days <= 5 ? "text-yellow-400/60" : ""}> · {days}d until due</span>;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{CURRENCY_SYMBOL} {formatBRL(budget.remaining, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest opacity-60">left of {formatCompact(budget.amount)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: budget.spent_percentage > 0 ? `${Math.max(budget.spent_percentage, 2)}%` : "0%" }}
                      className={`h-full rounded-full transition-all duration-700 ${budget.spent_percentage >= 90 ? "bg-chart-2" : budget.spent_percentage >= 70 ? "bg-yellow-400" : "bg-white"}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter opacity-50">
                    {budget.spent_percentage.toFixed(0)}% used • {CURRENCY_SYMBOL} {formatBRL(budget.spent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} spent
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] opacity-50">Recent Transactions</h2>
            <Link href="/transactions" className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">See All</Link>
          </div>
          <div className="space-y-2.5">
            {recentTransactions.length === 0 ? (
              <div className="bg-card rounded-xl p-6">
                <p className="text-xs text-muted-foreground text-center opacity-50">No transactions yet.</p>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isExpense = tx.type === "expense";
                const createdDate = tx.date ? new Date(tx.date) : null;
                const timeStr = createdDate
                  ? createdDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                  : null;
                return (
                  <Link
                    key={tx.id}
                    href={`/transactions/${tx.id}`}
                    className="flex items-center justify-between px-3 py-3 bg-card rounded-lg active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${isExpense ? "bg-chart-2/10 border-chart-2/20" : "bg-chart-1/10 border-chart-1/20"}`}>
                        <span className={`text-sm font-bold ${isExpense ? "text-chart-2" : "text-chart-1"}`}>
                          {isExpense ? "↓" : "↑"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {tx.description || tx.category?.name || "Transaction"}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-widest opacity-60 mt-0.5">
                          {tx.category?.name ?? "—"} {timeStr && `• ${timeStr}`}
                        </p>
                        {tx.status === "draft" && (
                          <span className="inline-block mt-0.5 text-[7px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-1.5 py-0.5 uppercase tracking-widest">
                            Needs Review
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black tracking-tight ${isExpense ? "text-chart-2" : "text-chart-1"}`}>
                        {isExpense ? "-" : "+"}{CURRENCY_SYMBOL} {formatBRL(tx.amount, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-normal opacity-50 mt-0.5">{tx.account?.name ?? "—"}</p>
                    </div>
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
        creditCards={creditCards.map((c) => ({ id: c.id, name: c.name }))}
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
