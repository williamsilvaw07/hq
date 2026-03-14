"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Loader2, ChevronDown } from "lucide-react";

const BUDGET_EMOJI_OPTIONS = [
  "🍔", "🍕", "🚗", "🍿", "🏠", "💡", "💳", "🛍️", "📱", "🎮",
  "✈️", "🏥", "📚", "🛒", "💧", "🔧", "📦", "🎵", "🐾", "💰",
];

type BudgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: any;
  categories?: any[];
  saving: boolean;
};

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  saving,
}: BudgetModalProps) {
  const [name, setName] = useState(initialData?.name ?? initialData?.category?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? initialData?.category?.icon ?? "💰");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [periodType, setPeriodType] = useState(initialData?.period_type ?? "month");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? initialData.category?.name ?? "");
      setIcon(initialData.icon ?? initialData.category?.icon ?? "💰");
      setAmount(initialData.amount?.toString() ?? "");
      setPeriodType(initialData.period_type ?? "month");
    } else {
      setName("");
      setIcon("💰");
      setAmount("");
      setPeriodType("month");
    }
  }, [initialData, isOpen]);

  const canSave = !saving && !!amount && parseFloat(amount) > 0 && !!name.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Budget" : "New Budget"}
      subtitle={initialData ? "EDIT BUDGET" : "NEW BUDGET"}
      showCloseButton={true}
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-xl bg-white/5 border border-white/[0.08] text-sm font-semibold text-muted-foreground active:scale-95 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave({ name, icon, amount: parseFloat(amount), period_type: periodType })}
              disabled={!canSave}
              className="flex-1 py-4 rounded-xl bg-white text-black text-sm font-bold active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : initialData ? "Save Changes" : "Create Budget"}
            </button>
          </div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-chart-2 active:scale-95 transition-all disabled:opacity-40"
            >
              Delete Budget
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6 py-1">

        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          {/* Icon picker */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-background border border-white/[0.08] flex items-center justify-center text-3xl">
              {icon}
            </div>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick icon"
            >
              {BUDGET_EMOJI_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Name input */}
          <div className="flex-1 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Budget Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Travel…"
              className="w-full bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/30"
              autoFocus={!initialData}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center py-2">
          <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">Monthly Limit</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-muted-foreground/25 tracking-tighter">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black bg-transparent border-none outline-none text-center w-full max-w-[200px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
            />
          </div>
        </div>

        {/* Reset Frequency */}
        <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
          <span className="text-xl shrink-0">🔄</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Resets Every</p>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-medium text-foreground appearance-none cursor-pointer"
            >
              <option value="weekly">Week</option>
              <option value="month">Month</option>
              <option value="quarterly">Quarter</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        </div>

      </div>
    </Modal>
  );
}
