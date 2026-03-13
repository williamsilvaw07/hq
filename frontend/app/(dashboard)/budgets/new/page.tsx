 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL } from "@/lib/format";

type Category = { id: number; name: string; type: string; icon?: string | null };

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

  const [icon, setIcon] = useState<string | null>(null);

  const emojiOptions = [
    "🍕",
    "🚗",
    "🍿",
    "🏠",
    "💡",
    "💳",
    "🛍️",
    "📱",
    "🎮",
    "✈️",
  ];

  useEffect(() => {
    if (!workspaceId) return;
    api<Category[]>(`/api/workspaces/${workspaceId}/categories`)
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, [workspaceId]);

  async function handleSave() {
    if (!workspaceId || !amount) return;
    setSaving(true);
    setError("");
    try {
      let effectiveCategoryId = categoryId;

      if (!effectiveCategoryId) {
        const name = title.trim() || "General";
        const created = await api<Category>(`/api/workspaces/${workspaceId}/categories`, {
          method: "POST",
          body: JSON.stringify({ name, type: "expense" }),
        });
        if (created.data) {
          effectiveCategoryId = String(created.data.id);
          setCategoryId(effectiveCategoryId);
        }
      }

      const selected =
        categories.find((c) => String(c.id) === effectiveCategoryId) ?? null;

      if (icon && selected && icon !== selected.icon) {
        await api(`/api/workspaces/${workspaceId}/categories/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({ icon }),
        });
      }

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await api(`/api/workspaces/${workspaceId}/budgets`, {
        method: "POST",
        body: JSON.stringify({
          category_id: Number(effectiveCategoryId),
          month,
          year,
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

  const displayIcon =
    icon ??
    selectedCategory?.icon ??
    (selectedCategory?.name
      ? selectedCategory.name.charAt(0).toUpperCase()
      : "💰");

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight selection:bg-primary/10 flex flex-col">
      <header className="z-40 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
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
          disabled={saving || !amount}
          className="text-sm font-bold text-primary hover:opacity-80 disabled:opacity-40 transition-opacity uppercase tracking-widest text-[10px]"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-8 pt-2 space-y-8 sm:space-y-12">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-card flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-black/20 active:scale-95 transition-all shrink-0"
          >
            {displayIcon}
          </button>
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Budget Title
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-bold text-foreground placeholder:text-muted/10 p-0"
              placeholder="Food & Dining"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="px-2 space-y-3">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Choose Icon
          </p>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-all active:scale-95 ${
                  icon === emoji
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Or custom
            </span>
            <input
              type="text"
              maxLength={2}
              value={icon ?? ""}
              onChange={(e) => setIcon(e.target.value || null)}
              placeholder="🙂"
              className="flex-1 bg-card rounded-lg border border-border px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
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
              className="w-full max-w-[240px] text-5xl sm:text-7xl font-heading font-black bg-transparent border-none outline-none text-center placeholder:text-muted/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tighter"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1 bg-card/30 rounded-xl sm:rounded-xl overflow-hidden">
          <div className="w-full px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between">
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
          <div className="h-px bg-border/20 mx-4 sm:mx-6" />
          <div className="w-full px-4 sm:px-6 pb-3 sm:pb-5 flex items-center justify-between">
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
                className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <select
                value={periodInterval}
                onChange={(e) => setPeriodInterval(Number(e.target.value))}
                className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
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

      <footer className="p-4 sm:p-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !amount}
          className="w-full py-3 sm:py-5 rounded-lg sm:rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Confirm Budget"}
        </button>
      </footer>
    </div>
  );
}

