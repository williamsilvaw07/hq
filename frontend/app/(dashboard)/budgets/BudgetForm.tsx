"use client";

import { useState, useEffect } from "react";
import { CURRENCY_SYMBOL, formatBRL } from "@/lib/format";

export type BudgetFormMode = "create" | "edit";

export type BudgetCategory = {
  id: number;
  name: string;
  type: string;
  icon?: string | null;
};

export type BudgetFormValues = {
  categoryId: string;
  title: string;
  amount: string;
  periodType: "week" | "month";
  periodInterval: number;
  icon: string | null;
};

export type BudgetFormProps = {
  mode: BudgetFormMode;
  categories: BudgetCategory[];
  initialValues?: Partial<BudgetFormValues>;
  saving: boolean;
  error?: string;
  onSubmit: (values: BudgetFormValues) => Promise<void> | void;
  onCancel: () => void;
};

const EMOJI_OPTIONS = ["🍕", "🚗", "🍿", "🏠", "💡", "💳", "🛍️", "📱", "🎮", "✈️"];

export function BudgetForm({
  mode,
  categories,
  initialValues,
  saving,
  error,
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [periodType, setPeriodType] = useState<"week" | "month">(initialValues?.periodType ?? "month");
  const [periodInterval, setPeriodInterval] = useState(initialValues?.periodInterval ?? 1);
  const [icon, setIcon] = useState<string | null>(initialValues?.icon ?? null);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.categoryId !== undefined) setCategoryId(initialValues.categoryId);
      if (initialValues.title !== undefined) setTitle(initialValues.title);
      if (initialValues.amount !== undefined) setAmount(initialValues.amount);
      if (initialValues.periodType !== undefined) setPeriodType(initialValues.periodType);
      if (initialValues.periodInterval !== undefined) setPeriodInterval(initialValues.periodInterval);
      if (initialValues.icon !== undefined) setIcon(initialValues.icon);
    }
  }, [initialValues?.categoryId, initialValues?.title, initialValues?.amount, initialValues?.periodType, initialValues?.periodInterval, initialValues?.icon]);

  const selectedCategory =
    categories.find((c) => String(c.id) === categoryId) ?? null;

  const displayIcon =
    icon ??
    selectedCategory?.icon ??
    (selectedCategory?.name
      ? selectedCategory.name.charAt(0).toUpperCase()
      : "💰");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSubmit({
      categoryId,
      title,
      amount,
      periodType,
      periodInterval,
      icon,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-card border border-border/40 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-black/20 active:scale-95 transition-all shrink-0"
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

      <div className="space-y-3">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Choose Icon
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
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

      <div className="flex flex-col items-center py-2 group">
        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">
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

      <div className="space-y-1 bg-card/30 rounded-xl sm:rounded-xl border border-border/30 overflow-hidden">
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

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg border border-border text-xs font-bold text-foreground uppercase tracking-widest active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !amount}
          className="flex-1 py-3 rounded-lg bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? (mode === "create" ? "Saving…" : "Saving…") : mode === "create" ? "Confirm Budget" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

