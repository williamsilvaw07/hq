"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { X, Check, LayoutGrid, Calendar, FileText, ChevronRight, ArrowUpRight } from "lucide-react";

type Category = { id: number; name: string; type: string };
type Budget = {
  id: number;
  amount: number;
  remaining: number;
  category?: { id: number; name: string };
};

const sym = "R$";

export default function NewTransactionPage() {
  const { workspaceId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get("category_id") ?? "";
  const initialTypeParam = searchParams.get("type");
  const initialType: "income" | "expense" =
    initialTypeParam === "income" ? "income" : "expense";
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetId, setBudgetId] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
      .then((r) => {
        if (Array.isArray(r.data)) setCategories(r.data);
      })
      .catch(() => {});

    api<Budget[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`)
      .then((r) => {
        if (!Array.isArray(r.data)) return;
        const withCategory = (r.data as Budget[]).filter(
          (b) => b.category && b.category.id,
        );
        setBudgets(withCategory);
      })
      .catch(() => {});
  }, [workspaceId]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const needCategory = type === "expense";
    if (!workspaceId || !amount) {
      setError(needCategory ? "Budget and amount are required." : "Amount is required.");
      return;
    }
    if (needCategory && !categoryId) {
      setError("Please select a budget.");
      return;
    }
    setLoading(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          ...(categoryId ? { category_id: Number(categoryId) } : {}),
          type,
          amount: parseFloat(amount),
          currency: "BRL",
          date,
          description: description || null,
          status: "confirmed",
        }),
      });
      router.push("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  }

  const relevantCategories = categories.filter((c) => c.type === type);
  const expenseBudgets = budgets;

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newCategoryName.trim()) return;
    setCategoryError("");
    setSavingCategory(true);
    try {
      const res = await api<Category>(`/api/workspaces/${workspaceId}/categories`, {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName.trim(), type }),
      });
      if (res.data) {
        setCategories((prev) => [...prev, res.data as Category]);
        setCategoryId(String(res.data.id));
        setNewCategoryName("");
        setShowNewCategory(false);
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 font-sans tracking-tight">
      <header className="px-5 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
            TRANSACTION
          </p>
          <h1 className="text-base sm:text-lg font-bold text-foreground">New Entry</h1>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground transition-colors active:scale-95 disabled:opacity-50"
          aria-label="Confirm"
        >
          <Check className="w-5 h-5" />
        </button>
      </header>

      <main className="px-5 space-y-4 sm:space-y-6">
        <div className="flex p-1.5 bg-card rounded-full">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2.5 sm:py-3 text-xs font-bold rounded-full transition-all uppercase tracking-wider ${
              type === "expense"
                ? "bg-chart-2 text-white shadow-inner"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2.5 sm:py-3 text-xs font-bold rounded-full transition-all uppercase tracking-wider ${
              type === "income"
                ? "bg-chart-1 text-white shadow-inner"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Income
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
            ENTER AMOUNT
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-muted-foreground">{sym}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 text-4xl sm:text-5xl font-heading font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tight"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
          {error && (
            <p className="text-sm text-chart-2 bg-chart-2/10 rounded-xl p-3">{error}</p>
          )}

          {type === "expense" && (
            <label className="block">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl sm:rounded-lg">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-chart-1/20 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-5 h-5 text-chart-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                    BUDGET
                  </p>
                  <select
                    value={budgetId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setBudgetId(id);
                      const selected = expenseBudgets.find(
                        (b) => String(b.id) === id,
                      );
                      if (selected?.category?.id) {
                        setCategoryId(String(selected.category.id));
                      }
                    }}
                    required
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer appearance-none"
                  >
                    <option value="">Select Budget</option>
                    {expenseBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.category?.name ?? "Budget"} — remaining R$
                        {b.remaining.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </label>
          )}

          {type === "expense" && (showNewCategory ? (
            <div className="p-3 sm:p-4 bg-card rounded-xl sm:rounded-lg space-y-2">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                New category
              </p>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 bg-background rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingCategory || !newCategoryName.trim()}
                  className="py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {savingCategory ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                    setCategoryError("");
                  }}
                  className="py-2 px-2 rounded-xl border border-border text-muted-foreground text-xs font-bold"
                >
                  Cancel
                </button>
              </form>
              {categoryError && <p className="text-xs text-chart-2">{categoryError}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Add custom category
            </button>
          ))}

          <label className="block">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl sm:rounded-lg">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-chart-4/20 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-chart-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                  DATE
                </p>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            </div>
          </label>

          <label className="block">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl sm:rounded-lg">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                  NOTES
                </p>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description..."
                  className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-lg bg-white text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Saving…" : "CONFIRM ENTRY"}
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </form>
      </main>
    </div>
  );
}
