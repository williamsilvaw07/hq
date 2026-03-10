"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatBRL, CURRENCY_SYMBOL } from "@/lib/format";
import { ShoppingBag, Bus, Coffee, Plus, X } from "lucide-react";

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

const categoryIcons: Record<string, typeof ShoppingBag> = { Shopping: ShoppingBag, Transport: Bus, Food: Coffee };
const categoryColors = ["bg-orange-500/20 text-orange-500", "bg-chart-3/20 text-chart-3", "bg-chart-4/20 text-chart-4"];

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

  return (
    <div className="space-y-8 pb-4">
      <header className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="section-title mt-1">Monthly spending limits</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-white/10 active:scale-95 transition-all"
          aria-label="Add budget"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {showAddForm && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Add budget</h3>
            <button type="button" onClick={() => { setShowAddForm(false); setError(""); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div>
              <label className="label block mb-2">Category</label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                required
                className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="">Select category</option>
                {availableCategories.length === 0 && categories.length > 0 ? (
                  <option value="" disabled>All categories have a budget</option>
                ) : (
                  availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
              {!showNewCategory ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  + Add custom category
                </button>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-secondary/50 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New category</p>
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 bg-card rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                      autoFocus
                    />
                    <button type="submit" disabled={savingCategory || !newCategoryName.trim()} className="py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
                      {savingCategory ? "…" : "Add"}
                    </button>
                    <button type="button" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); setCategoryError(""); }} className="py-2 px-2 rounded-xl border border-border text-muted-foreground text-xs font-bold">
                      Cancel
                    </button>
                  </form>
                  {categoryError && <p className="text-xs text-chart-2">{categoryError}</p>}
                </div>
              )}
            </div>
              <div>
                <label className="label block mb-2">Resets every</label>
                <div className="flex gap-2">
                  <select
                    value={newPeriodType}
                    onChange={(e) => setNewPeriodType(e.target.value as "day" | "week" | "month" | "year")}
                    className="flex-1 bg-card rounded-2xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                  <select
                    value={newPeriodInterval}
                    onChange={(e) => setNewPeriodInterval(Number(e.target.value))}
                    className="w-28 bg-card rounded-2xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    {newPeriodType === "week" ? (
                      <option value={1}>Every week</option>
                    ) : (
                      <>
                        <option value={1}>Every month</option>
                        <option value={3}>Every 3 months</option>
                      </>
                    )}
                  </select>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                  {newPeriodType === "week" && "Resets at the start of each week"}
                  {newPeriodType === "month" && newPeriodInterval === 1 && "Resets at the start of each month"}
                  {newPeriodType === "month" && newPeriodInterval === 3 && "Resets every 3 months"}
                </p>
              </div>
            <div>
              <label className="label block mb-2">Limit ({CURRENCY_SYMBOL})</label>
              <input
                type="text"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
                placeholder="0"
                required
                className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            {error && <p className="text-sm text-chart-2">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving || availableCategories.length === 0} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Add budget"}
              </button>
            </div>
          </form>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-foreground">Monthly Budgets</h2>
        </div>
        <div className="space-y-4">
          {loading && workspaceId ? (
            <p className="text-muted-foreground text-sm py-4">Loading…</p>
          ) : budgets.length === 0 ? (
            <div className="card-base p-8 text-center">
              <p className="text-muted-foreground text-sm">No budgets set for this month.</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 py-2.5 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
              >
                Add your first budget
              </button>
            </div>
          ) : (
            budgets.map((b, i) => {
              const amount = Number(b.amount);
              const spent = Number(b.spent);
              const remaining = Number(b.remaining);
              const pct = Number.isFinite(b.spent_percentage) ? b.spent_percentage : amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
              const Icon = categoryIcons[b.category?.name ?? ""] ?? ShoppingBag;
              const colorClass = categoryColors[i % categoryColors.length] ?? "bg-chart-4/20 text-chart-4";
              const periodLabel =
                b.period_type === "week"
                  ? "Weekly"
                  : b.period_type === "month" && (b.period_interval ?? 1) === 3
                    ? "Every 3 Months"
                    : "Monthly";

              return (
                <div key={b.id} className="bg-secondary p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold">{b.category?.name ?? "Category"}</span>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {periodLabel} • Resets {b.next_reset_date}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {CURRENCY_SYMBOL}{" "}
                      {formatBRL(remaining, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      <span className="text-muted-foreground font-medium">
                        / {CURRENCY_SYMBOL}{" "}
                        {formatBRL(amount, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-chart-4 rounded-full transition-all"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {pct.toFixed(0)}% spent
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {CURRENCY_SYMBOL}{" "}
                      {formatBRL(remaining, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      remaining
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
