"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";

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
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "💰");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [periodType, setPeriodType] = useState(initialData?.period_type ?? "month");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setIcon(initialData.icon ?? "💰");
      setAmount(initialData.amount?.toString() ?? "");
      setPeriodType(initialData.period_type ?? "month");
    } else {
      setName("");
      setIcon("💰");
      setAmount("");
      setPeriodType("month");
    }
  }, [initialData, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Budget" : "New Budget"}
      subtitle="BUDGET CONFIG"
      showCloseButton={true}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSave({ name, icon, amount: parseFloat(amount), period_type: periodType })}
            disabled={saving || !amount || !name}
            className="w-full py-4 rounded-2xl bg-white text-black text-sm font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "Confirming..." : initialData ? "Confirm Changes" : "Confirm Budget"}
          </button>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              className="w-full py-2 text-[10px] font-black text-chart-2 uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Delete Budget
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-10 py-2">
        {/* Name & Icon */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-3xl shadow-inner border border-border/10">
              {icon || "💰"}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Budget Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Groceries, Travel..."
                className="w-full bg-transparent border-none outline-none text-xl font-bold text-foreground placeholder:text-muted-foreground/30 ring-0 p-0"
                autoFocus={!initialData}
              />
            </div>
          </div>

          <div className="bg-card/50 rounded-2xl p-3 border border-border/10">
            <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Icon</p>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground appearance-none ring-0 p-0"
            >
              {BUDGET_EMOJI_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center py-2">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Set Limit</label>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-muted-foreground/30 tracking-tighter">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black bg-transparent border-none outline-none text-center w-full max-w-[200px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Reset Frequency */}
        <div className="bg-card/40 rounded-[2rem] border border-border/10 overflow-hidden divide-y divide-border/5">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-lg">⏱</div>
              <span className="text-sm font-bold">Reset Frequency</span>
            </div>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-black text-primary uppercase tracking-widest appearance-none text-right"
            >
              <option value="weekly">Weekly</option>
              <option value="month">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
