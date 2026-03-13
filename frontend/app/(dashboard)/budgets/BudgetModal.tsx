"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Icon } from "@iconify/react";

type Category = { id: number; name: string; icon?: string | null };

type BudgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: any;
  categories: Category[];
  saving: boolean;
};

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  categories,
  saving,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [periodType, setPeriodType] = useState(initialData?.period_type ?? "month");

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.category_id);
      setAmount(initialData.amount?.toString());
      setPeriodType(initialData.period_type ?? "month");
    } else {
      setCategoryId("");
      setAmount("");
      setPeriodType("month");
    }
  }, [initialData, isOpen]);

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  const emojiOptions = ["🍔", "🍕", "🚗", "🍿", "🏠", "💡", "💳", "🛍️", "📱", "🎮", "✈️"];

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
            onClick={() => onSave({ category_id: Number(categoryId), amount: parseFloat(amount), period_type: periodType })}
            disabled={saving || !amount || !categoryId}
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
        {/* Category & Icon Picker */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-3xl shadow-inner border border-border/10">
              {selectedCategory?.icon || "💰"}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Budget Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xl font-bold text-foreground appearance-none p-0 cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Quick Icons</p>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-lg active:scale-90 transition-all hover:bg-secondary/50"
                  onClick={() => {/* If editing category icon were possible here */}}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              autoFocus={!initialData}
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
