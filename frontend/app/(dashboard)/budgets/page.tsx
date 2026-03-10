"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatBRL, CURRENCY_SYMBOL } from "@/lib/format";
import { Plus } from "lucide-react";

type Budget = {
  id: number;
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
type Category = { id: number; name: string; type: string };

const categoryColors = [
  "bg-orange-500/10 border-orange-500/40",
  "bg-chart-3/10 border-chart-3/40",
  "bg-chart-4/10 border-chart-4/40",
];

function loadBudgets(workspaceId: number): Promise<Budget[]> {
  return api<Budget[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`)
    .then((r) => (Array.isArray(r.data) ? r.data : []));
}

export default function BudgetsPage() {
  const { workspaceId } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [newPeriodType, setNewPeriodType] = useState<"day" | "week" | "month" | "year">("month");
  const [newPeriodInterval, setNewPeriodInterval] = useState(1);

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
    if (!workspaceId || !showAddForm) return;
    api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, [workspaceId, showAddForm]);

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newCategoryId || !newAmount) return;
    setError("");
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/budgets`, {
        method: "POST",
        body: JSON.stringify({
          category_id: Number(newCategoryId),
          period_type: newPeriodType,
          period_interval: newPeriodInterval,
          amount: parseFloat(newAmount.replace(",", ".")) || 0,
          currency: "BRL",
        }),
      });
      const list = await loadBudgets(workspaceId);
      setBudgets(list);
      setShowAddForm(false);
      setNewCategoryId("");
      setNewAmount("");
      setNewPeriodType("month");
      setNewPeriodInterval(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newCategoryName.trim()) return;
    setCategoryError("");
    setSavingCategory(true);
    try {
      const res = await api<Category>(`/api/workspaces/${workspaceId}/categories`, {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName.trim(), type: "expense" }),
      });
      if (res.data) {
        setCategories((prev) => [...prev, res.data as Category]);
        setNewCategoryId(String(res.data.id));
        setNewCategoryName("");
        setShowNewCategory(false);
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  }

  const existingCategoryIds = new Set(budgets.map((b) => b.category?.id).filter(Boolean) as number[]);
  const availableCategories = categories.filter((c) => !existingCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining || 0), 0);
  const totalSpent = Math.max(0, totalBudget - totalRemaining);
  const totalPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

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
    } catch (err) {
      // Optionally surface error later; for now fail silently to avoid breaking UI.
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="sticky top-0 z-30 -mx-6 px-6 pt-4 pb-5 bg-background/80 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">My Budgets</h1>
          <Link
            href="/budgets/new"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all active:scale-95 shadow-lg shadow-white/5"
            aria-label="Add budget"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-card p-5 rounded-3xl border border-border/50">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                Total Monthly Budget
              </p>
              <p className="text-2xl font-black">
                {CURRENCY_SYMBOL}{" "}
                {formatBRL(totalBudget, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                Remaining
              </p>
              <p className="text-xl font-bold text-chart-1">
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
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </header>

      <main className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              Active Budgets
            </h3>
          </div>
          <div className="space-y-3">
            {loading && workspaceId ? (
              <p className="text-muted-foreground text-sm py-4 px-1">
                Loading…
              </p>
            ) : budgets.length === 0 ? (
              <div className="bg-card p-8 rounded-[2rem] border border-border/50 text-center">
                <p className="text-muted-foreground text-sm">
                  No budgets set yet.
                </p>
                <Link
                  href="/budgets/new"
                  className="inline-flex items-center justify-center mt-4 py-2.5 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
                >
                  Add your first budget
                </Link>
              </div>
            ) : (
              budgets.map((b, i) => {
                const amount = Number(b.amount);
                const spent = Number(b.spent);
                const remaining = Number(b.remaining);
                const pct = Number.isFinite(b.spent_percentage)
                  ? b.spent_percentage
                  : amount > 0
                    ? Math.min(100, (spent / amount) * 100)
                    : 0;
                const colorClass =
                  categoryColors[i % categoryColors.length] ??
                  "bg-chart-4/10 border-chart-4/40";
                const periodLabel =
                  b.period_type === "week"
                    ? "Weekly"
                    : b.period_type === "month" &&
                        (b.period_interval ?? 1) === 3
                      ? "Every 3 Months"
                      : "Monthly";

                return (
                  <div
                    key={b.id}
                    className="bg-card p-5 rounded-[2rem] border border-border/50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${colorClass}`}
                        >
                          <span>
                            {b.category?.icon ||
                              (b.category?.name
                                ? b.category.name.charAt(0).toUpperCase()
                                : "💰")}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">
                            {b.category?.name ?? "Category"}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {periodLabel} • Resets {b.next_reset_date}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          href={`/budgets/${b.id}/edit`}
                          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-secondary/40"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-chart-2 hover:opacity-80 px-3 py-1 rounded-xl bg-chart-2/10"
                        >
                          Delete
                        </button>
                        {b.category?.id ? (
                          <Link
                            href={`/transactions/new?category_id=${b.category.id}&type=expense`}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 px-3 py-1 rounded-xl bg-primary/10"
                          >
                            Add Entry
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-muted-foreground">
                          Spent{" "}
                          {CURRENCY_SYMBOL}{" "}
                          {formatBRL(spent, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-foreground">
                          {CURRENCY_SYMBOL}{" "}
                          {formatBRL(remaining, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          left
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-chart-4 rounded-full"
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
    </div>
  );
}
