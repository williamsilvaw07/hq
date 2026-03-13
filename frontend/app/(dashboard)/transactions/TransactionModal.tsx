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
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(initialData?.account_id?.toString() || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "expense");
      setAmount(initialData.amount?.toString() || "");
      setDescription(initialData.description || "");
      setCategoryId(initialData.category_id?.toString() || "");
      setAccountId(initialData.account_id?.toString() || "");
      setDate(initialData.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setType("expense");
      setAmount("");
      setDescription("");
      setCategoryId("");
      setAccountId("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Entry" : "Log Transaction"}
      subtitle={initialData ? "UPDATE ENTRY" : "NEW ENTRY"}
      showCloseButton={true}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({
              type,
              amount: parseFloat(amount),
              description,
              category_id: Number(categoryId),
              account_id: Number(accountId),
              date
            })}
            disabled={saving || !amount || !categoryId}
            className="flex-1 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "Processing..." : "Confirm Entry"}
          </button>
        </div>
      }
    >
      <div className="space-y-8 py-2">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-1 rounded-[1.5rem] border border-border/10">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "expense" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "income" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-4 opacity-60">Transaction Amount</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-muted-foreground/30 leading-none">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black bg-transparent border-none outline-none text-center w-full max-w-[220px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              autoFocus={!initialData}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div className="bg-card/50 rounded-2xl p-4 border border-border/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 shadow-inner">
              <Icon icon="solar:pen-new-square-linear" className="text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Description</p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card/50 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Icon icon="solar:tag-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5 opacity-50">Budget</p>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground appearance-none truncate cursor-pointer"
                >
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-card/50 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Icon icon="solar:calendar-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5 opacity-50">Date</p>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-foreground appearance-none"
                />
              </div>
            </div>

            <div className="bg-card/50 rounded-2xl p-3 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500 shrink-0">
                <Icon icon="solar:notes-linear" className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5 opacity-50">Note</p>
                <input
                  type="text"
                  placeholder="Optional..."
                  className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
