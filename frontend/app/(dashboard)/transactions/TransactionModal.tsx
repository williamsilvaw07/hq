"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Loader2, FileText, Tag, CalendarDays, ChevronDown } from "lucide-react";

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: () => Promise<void>;
  categories: any[];
  accounts: any[];
  saving: boolean;
  initialData?: any;
};

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
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

  const canSave = !saving && !!amount && parseFloat(amount) > 0 && !!categoryId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Entry" : "New Transaction"}
      subtitle={initialData ? "EDIT ENTRY" : "NEW ENTRY"}
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
              onClick={() => onSave({ type, amount: parseFloat(amount), description, category_id: Number(categoryId), account_id: Number(accountId), date })}
              disabled={!canSave}
              className="flex-1 py-4 rounded-xl bg-white text-black text-sm font-bold active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : initialData ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-chart-2 active:scale-95 transition-all disabled:opacity-40"
            >
              Delete Transaction
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6 py-1">

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded-2xl">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                type === t
                  ? "bg-white/10 text-foreground shadow-sm"
                  : "text-muted-foreground/50"
              }`}
            >
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center py-2">
          <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">Amount</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-muted-foreground/25 tracking-tighter">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black bg-transparent border-none outline-none text-center w-full max-w-[220px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
              autoFocus={!initialData}
            />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-2.5">

          {/* Description */}
          <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <FileText className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Description</p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <Tag className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Category</p>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground appearance-none cursor-pointer"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <CalendarDays className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground appearance-none"
              />
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}
