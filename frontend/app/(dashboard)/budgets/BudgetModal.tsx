"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Loader2, Pencil, RefreshCw, CreditCard } from "lucide-react";

const BUDGET_EMOJI_OPTIONS = [
  "🍔", "🍕", "🚗", "🍿", "🏠", "💡", "💳", "🛍️", "📱", "🎮",
  "✈️", "🏥", "📚", "🛒", "💧", "🔧", "📦", "🎵", "🐾", "💰",
];

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

type CardOption = { id: number; name: string };

type BudgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: any;
  categories?: any[];
  creditCards?: CardOption[];
  saving: boolean;
};

export function BudgetModal({ isOpen, onClose, onSave, onDelete, initialData, creditCards = [], saving }: BudgetModalProps) {
  const [name, setName] = useState(initialData?.name ?? initialData?.category?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? initialData?.category?.icon ?? "💰");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [periodType, setPeriodType] = useState(initialData?.period_type ?? "month");
  const [cardId, setCardId] = useState<string>(initialData?.credit_card_id?.toString() ?? "");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? initialData.category?.name ?? "");
      setIcon(initialData.icon ?? initialData.category?.icon ?? "💰");
      setAmount(initialData.amount?.toString() ?? "");
      setPeriodType(initialData.period_type ?? "month");
      setCardId(initialData.credit_card_id?.toString() ?? "");
    } else {
      setName(""); setIcon("💰"); setAmount(""); setPeriodType("month"); setCardId("");
    }
  }, [initialData, isOpen]);

  const canSave = !saving && !!amount && parseFloat(amount) > 0 && !!name.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      subtitle={initialData ? "EDIT BUDGET" : "NEW BUDGET"}
      title={name || (initialData ? "Edit Budget" : "New Budget")}
      footer={
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-full bg-white/[0.07] text-sm font-bold uppercase tracking-widest text-muted-foreground active:scale-95 transition-all disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => onSave({ name, icon, amount: parseFloat(amount), period_type: periodType, credit_card_id: cardId ? parseInt(cardId, 10) : null })}
              disabled={!canSave}
              className="flex-[1.4] py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : initialData ? "Save Changes" : "Create Budget"}
            </button>
          </div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              disabled={saving}
              className="w-full py-2 text-sm font-bold text-chart-2 uppercase tracking-widest text-center active:opacity-70 transition-all disabled:opacity-40"
            >
              Delete Budget
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-2">

        {/* Category / Icon row */}
        <div className="flex items-center gap-4 border border-white/[0.08] rounded-2xl p-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex flex-col items-center justify-center gap-0.5">
              <span className="text-3xl leading-none">{icon}</span>
              <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">Emoji</span>
            </div>
            {/* Edit badge */}
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md pointer-events-none">
              <Pencil className="w-2.5 h-2.5 text-black" />
            </div>
            {/* Invisible select overlaid */}
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick icon"
            >
              {BUDGET_EMOJI_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Category</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budget name…"
              className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/25"
              autoFocus={!initialData}
            />
          </div>
        </div>

        {/* Budget Limit */}
        <div className="text-center py-2">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3">Budget Limit</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-lg font-light text-muted-foreground/30 leading-none">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-4xl font-black bg-transparent outline-none text-center w-auto min-w-[60px] max-w-[200px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
            />
          </div>
        </div>

        {/* Reset Frequency */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Reset Frequency</p>
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/30" />
          </div>
          <div className="grid grid-cols-3 bg-black/30 p-1 rounded-full gap-1">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriodType(value)}
                className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  periodType === value
                    ? "bg-white text-black shadow-sm"
                    : "text-muted-foreground/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Linked Card */}
        {creditCards.length > 0 && (
          <div className="border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Linked Card</p>
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground/30" />
            </div>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-bold text-foreground appearance-none cursor-pointer"
            >
              <option value="">No card linked</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

      </div>
    </Modal>
  );
}
