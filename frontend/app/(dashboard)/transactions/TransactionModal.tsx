"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Icon } from "@iconify/react";

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories: any[];
  accounts: any[];
  saving: boolean;
  initialData?: any;
};

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  accounts,
  saving,
  initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<"expense" | "income">(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [accountId, setAccountId] = useState(initialData?.account_id ?? "");
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount?.toString());
      setDescription(initialData.description ?? "");
      setCategoryId(initialData.category_id);
      setAccountId(initialData.account_id ?? "");
      setDate(initialData.date);
    }
  }, [initialData]);

  const selectedCategory = categories.find(c => c.id === Number(categoryId));
  const selectedAccount = accounts.find(a => a.id === Number(accountId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Transaction"
      subtitle="NEW ENTRY"
      showCloseButton={false}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-border text-xs font-black uppercase tracking-widest text-foreground active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ type, amount: parseFloat(amount), description, category_id: Number(categoryId), account_id: Number(accountId), date })}
            disabled={saving || !amount}
            className="flex-1 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Confirming..." : "Confirm Entry"}
          </button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-card/30 p-1 rounded-2xl border border-border/10">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${type === "expense" ? "bg-chart-2/10 text-chart-2 border border-chart-2/20" : "text-muted-foreground"}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${type === "income" ? "bg-chart-1/10 text-chart-1 border border-chart-1/20" : "text-muted-foreground"}`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-2">Amount</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-muted-foreground/30">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-5xl font-black bg-transparent border-none outline-none text-center w-full max-w-[180px] tracking-tighter"
              placeholder="0"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          {/* Description */}
          <div className="bg-card/40 rounded-2xl p-4 border border-border/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Icon icon="solar:pen-new-square-linear" className="text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Description</p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="bg-card/40 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Icon icon="solar:tag-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Category</p>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground appearance-none truncate"
                >
                  <option value="">Select</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Account */}
            <div className="bg-card/40 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Icon icon="solar:wallet-2-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Account</p>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground appearance-none truncate"
                >
                  <option value="">Main</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="bg-card/40 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-chart-4/10 flex items-center justify-center text-chart-4 shrink-0">
                <Icon icon="solar:calendar-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Date</p>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-foreground block box-border min-w-0"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card/40 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500 shrink-0">
                <Icon icon="solar:notes-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Notes</p>
                <input
                  type="text"
                  placeholder="Add note..."
                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
