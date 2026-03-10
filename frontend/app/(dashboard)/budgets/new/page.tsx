 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL } from "@/lib/format";

type Category = { id: number; name: string; type: string };

export default function NewBudgetPage() {
  const router = useRouter();
  const { workspaceId } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [periodType, setPeriodType] = useState<"week" | "month">("month");
  const [periodInterval, setPeriodInterval] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, [workspaceId]);

  async function handleSave() {
    if (!workspaceId || !categoryId || !amount) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/workspaces/${workspaceId}/budgets`, {
        method: "POST",
        body: JSON.stringify({
          category_id: Number(categoryId),
          period_type: periodType,
          period_interval: periodInterval,
          amount: parseFloat(amount.replace(",", ".")) || 0,
          currency: "BRL",
        }),
      });
      router.push("/budgets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory =
    categories.find((c) => String(c.id) === categoryId) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight selection:bg-primary/10 flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-[10px]"
        >
          Cancel
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
          New Budget
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !categoryId || !amount}
          className="text-sm font-bold text-primary hover:opacity-80 disabled:opacity-40 transition-opacity uppercase tracking-widest text-[10px]"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <main className="flex-1 px-8 pt-2 space-y-12">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="w-20 h-20 rounded-3xl bg-card border border-border/40 flex items-center justify-center text-4xl shadow-xl shadow-black/20 active:scale-95 transition-all"
          >
            {selectedCategory ? selectedCategory.name.charAt(0) : "💰"}
          </button>
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Budget Title
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-2xl font-bold text-foreground placeholder:text-muted/10 p-0"
              placeholder="Food & Dining"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full bg-card rounded-2xl border border-border px-4 py-2 text-sm text-foreground"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center py-4 group">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Set Limit
          </label>
          <div className="flex items-center gap-1">
            <span className="text-3xl font-light text-muted-foreground/30 tracking-tighter">
              {CURRENCY_SYMBOL}
            </span>
            <input
              type="number"
              className="w-full max-w-[240px] text-7xl font-heading font-black bg-transparent border-none outline-none text-center placeholder:text-muted/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tighter"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1 bg-card/30 rounded-[2rem] border border-border/30 overflow-hidden">
          <div className="w-full px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <span className="text-muted-foreground text-lg">⏱</span>
              </div>
              <span className="text-sm font-bold">Reset Frequency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {periodType === "week"
                  ? "Weekly"
                  : periodInterval === 3
                    ? "Every 3 Months"
                    : "Monthly"}
              </span>
            </div>
          </div>
          <div className="h-px bg-border/20 mx-6" />
          <div className="w-full px-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <span className="text-muted-foreground text-lg">📅</span>
              </div>
              <span className="text-sm font-bold">Resets</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={periodType}
                onChange={(e) =>
                  setPeriodType(e.target.value === "week" ? "week" : "month")
                }
                className="bg-card rounded-2xl border border-border px-3 py-1.5 text-xs"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <select
                value={periodInterval}
                onChange={(e) => setPeriodInterval(Number(e.target.value))}
                className="bg-card rounded-2xl border border-border px-3 py-1.5 text-xs"
              >
                {periodType === "week" ? (
                  <option value={1}>Every week</option>
                ) : (
                  <>
                    <option value={1}>Every month</option>
                    <option value={3}>Every 3 months</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <p className="px-2 text-sm text-chart-2">
            {error}
          </p>
        )}
      </main>

      <footer className="p-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !categoryId || !amount}
          className="w-full py-5 rounded-3xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Confirm Budget"}
        </button>
      </footer>
    </div>
  );
}

