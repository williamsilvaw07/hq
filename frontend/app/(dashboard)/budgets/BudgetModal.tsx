"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";

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
    }
  }, [initialData]);

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Dining Out" : "New Budget"}
      subtitle="EDIT BUDGET"
      showCloseButton={false}
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-border text-xs font-black uppercase tracking-widest text-foreground active:scale-95 transition-all"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => onSave({ category_id: Number(categoryId), amount: parseFloat(amount), period_type: periodType })}
              disabled={saving || !amount}
              className="flex-1 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
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
      <div className="space-y-8 py-2">
        {/* Category Picker Mockup Style */}
        <div className="bg-card/50 rounded-2xl p-4 border border-border/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">
              {selectedCategory?.icon || "🍔"}
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Category</p>
              <h4 className="text-sm font-bold">{selectedCategory?.name || "Select Category"}</h4>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <span className="text-xs font-bold">✓</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-4">Budget Limit</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-muted-foreground/30">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black bg-transparent border-none outline-none text-center w-full max-w-[200px] tracking-tighter"
              placeholder="0"
            />
          </div>
        </div>

        {/* Frequency Picker */}
        <div className="space-y-3">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Reset Frequency</p>
          <div className="grid grid-cols-3 gap-2 bg-card/30 p-1 rounded-2xl border border-border/10">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodType(p)}
                className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${periodType === p ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
