"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatBRL, CURRENCY_SYMBOL } from "@/lib/format";
import { Plus } from "lucide-react";
import { BudgetModal } from "./BudgetModal";

type Budget = {
  id: number;
  name?: string | null;
  icon?: string | null;
  amount: number;
  currency: string;
  period_type?: string;
  period_interval?: number;
  current_period_start: string;
  current_period_end: string;
  next_reset_date: string;
  spent: number;
  remaining: number;
  spent_percentage: number;
  category?: { id: number; name: string; icon?: string | null; color?: string | null };
};

type Category = { id: number; name: string; type: string; icon?: string | null };

const categoryColors = [
  "bg-orange-500/10 border-orange-500/40",
  "bg-blue-500/10 border-blue-500/40",
  "bg-purple-500/10 border-purple-500/40",
];

function loadBudgets(workspaceId: number): Promise<Budget[]> {
  return api<Budget[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`)
    .then((r) => (Array.isArray(r.data) ? r.data : []));
}

export default function BudgetsPage() {
  const { workspaceId } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setBudgets([]);
      return;
    }
    setLoading(true);
    loadBudgets(workspaceId)
      .then(setBudgets)
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !modalOpen) return;
    api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, [workspaceId, modalOpen]);

  async function handleSaveBudget(data: any) {
    if (!workspaceId) return;
    setError("");
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
      const list = await loadBudgets(workspaceId);
      setBudgets(list);
      setModalOpen(false);
      setEditingBudget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id: number) {
    if (!workspaceId) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm("Delete this budget? This cannot be undone.");
      if (!ok) return;
    }
    try {
      await api(`/api/workspaces/${workspaceId}/budgets/${id}`, {
        method: "DELETE",
      });
      const list = await loadBudgets(workspaceId);
      setBudgets(list);
      setModalOpen(false);
      setEditingBudget(null);
    } catch (err) {
      // ignore
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining || 0), 0);
  const totalSpent = Math.max(0, totalBudget - totalRemaining);
  const totalPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-32 font-sans tracking-tight">
      <header className="z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <h1 className="page-title">Budgets</h1>
        <button
          onClick={() => {
            setEditingBudget(null);
            setModalOpen(true);
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95 border border-border/50"
          aria-label="Add Budget"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      <div className="px-4 sm:px-0">
        <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl border border-border/50 shadow-xl shadow-black/10">
          <div className="flex justify-between items-end mb-3 sm:mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-60">
                Total Monthly Budget
              </p>
              <p className="text-2xl sm:text-3xl font-black">
                {CURRENCY_SYMBOL}{" "}
                {formatBRL(totalBudget, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-60">
                Remaining
              </p>
              <p className="text-xl sm:text-2xl font-bold text-chart-1">
                {CURRENCY_SYMBOL}{" "}
                {formatBRL(totalRemaining, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              style={{ width: `${totalPct}%` }}
              className="h-full bg-white rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-0 py-6 sm:py-8 space-y-6 sm:space-y-10">
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em] opacity-60">
            Active Budgets
          </h3>
          <div className="grid grid-cols-1 gap-3.5">
            {loading && workspaceId ? (
              <p className="text-muted-foreground text-sm py-4 px-1">Loading…</p>
            ) : budgets.length === 0 ? (
              <div className="bg-card/50 p-8 rounded-xl border border-border/30 text-center space-y-4">
                <p className="text-muted-foreground text-sm">No budgets set yet.</p>
                <button
                  onClick={() => {
                    setEditingBudget(null);
                    setModalOpen(true);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Create Budget
                </button>
              </div>
            ) : (
              budgets.map((budget, i) => {
                const amount = Number(budget.amount);
                const spent = Number(budget.spent);
                const remaining = Number(budget.remaining);
                const pct = Number.isFinite(budget.spent_percentage)
                  ? budget.spent_percentage
                  : amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
                
                const colorClass = categoryColors[i % categoryColors.length] ?? "bg-zinc-500/10 border-zinc-500/20";
                
                return (
                  <div
                    key={budget.id}
                    onClick={() => {
                      setEditingBudget(budget);
                      setModalOpen(true);
                    }}
                    className="bg-card p-4 sm:p-6 rounded-xl border border-border/40 space-y-4 active:scale-[0.98] transition-all cursor-pointer group hover:border-border/80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClass} text-2xl`}>
                          {budget.icon || budget.category?.icon || "💰"}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{budget.name || budget.category?.name || "Budget"}</h4>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                            {budget.period_type ?? "Monthly"} • {budget.next_reset_date || "Active"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {CURRENCY_SYMBOL} {formatBRL(remaining, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter ml-1">left</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                          of {CURRENCY_SYMBOL} {formatBRL(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-white rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {modalOpen && (
        <BudgetModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveBudget}
          onDelete={handleDeleteBudget}
          initialData={editingBudget}
          categories={categories}
          saving={saving}
        />
      )}
    </div>
  );
}
