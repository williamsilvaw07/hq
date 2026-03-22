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
  isOpen, onClose, onSave, onDelete,
  categories, accounts, saving, initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(initialData?.account_id?.toString() || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryConfirmed, setCategoryConfirmed] = useState(false);

  const isDraft = initialData?.status === "draft";
  const hasSuggestedCategory = isDraft && !!initialData?.category_id;

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "expense");
      setAmount(initialData.amount?.toString() || "");
      setDescription(initialData.description || "");
      setCategoryId(initialData.category_id?.toString() || "");
      setAccountId(initialData.account_id?.toString() || "");
      setDate(initialData.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setCategoryConfirmed(false);
    } else {
      setType("expense"); setAmount(""); setDescription("");
      setCategoryId(""); setAccountId(""); setDate(new Date().toISOString().slice(0, 10));
      setCategoryConfirmed(false);
    }
  }, [initialData, isOpen]);

  const canSave = !saving && !!amount && parseFloat(amount) > 0 && (type === "income" || !!categoryId || categoryId === "unbudgeted") && (!hasSuggestedCategory || categoryConfirmed || categoryId !== initialData?.category_id?.toString());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      subtitle={initialData ? "EDIT ENTRY" : "NEW TRANSACTION"}
      title={initialData ? (initialData.description || "Edit Entry") : "Log Transaction"}
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
              onClick={() => onSave({ type, amount: parseFloat(amount), description, category_id: categoryId === "unbudgeted" ? null : Number(categoryId), account_id: Number(accountId), date, ...(isDraft ? { status: "confirmed" } : {}) })}
              disabled={!canSave}
              className="flex-[1.4] py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : isDraft ? "Confirm & Save" : initialData ? "Save Changes" : "Confirm Entry"}
            </button>
          </div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="w-full py-2 text-sm font-bold text-chart-2 uppercase tracking-widest text-center active:opacity-70 transition-all disabled:opacity-40"
            >
              Delete Transaction
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-2">

        {/* Type toggle */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">Type</p>
          <div className="grid grid-cols-2 bg-black/30 p-1 rounded-full gap-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  type === t ? "bg-white text-black shadow-sm" : "text-muted-foreground/60"
                }`}
              >
                {t === "expense" ? "Expense" : "Income"}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-2">
          <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">Amount</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-lg font-light text-muted-foreground/30 leading-none">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-4xl font-black bg-transparent outline-none text-center w-auto min-w-[60px] max-w-[200px] tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
              autoFocus={!initialData}
            />
          </div>
        </div>

        {/* Fields */}
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">

          {/* Description */}
          <div className="flex items-center gap-3 px-4 py-4">
            <FileText className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Description</p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                className="w-full bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/25"
              />
            </div>
          </div>

          {/* Category — expense only */}
          {type === "expense" && (
            <div className="flex flex-col">
              <div className="flex items-center gap-3 px-4 py-4">
                <Tag className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">
                    Category
                    {hasSuggestedCategory && !categoryConfirmed && categoryId === initialData?.category_id?.toString() && (
                      <span className="ml-2 text-yellow-400/80 normal-case tracking-normal">— AI suggestion</span>
                    )}
                  </p>
                  <select
                    value={categoryId}
                    onChange={(e) => { setCategoryId(e.target.value); setCategoryConfirmed(true); }}
                    className="w-full bg-transparent outline-none text-sm font-semibold text-foreground appearance-none cursor-pointer"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="unbudgeted">Unbudgeted</option>
                  </select>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground/20 shrink-0" />
              </div>
              {hasSuggestedCategory && !categoryConfirmed && categoryId === initialData?.category_id?.toString() && (
                <button
                  type="button"
                  onClick={() => setCategoryConfirmed(true)}
                  className="mx-4 mb-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  Confirm Category
                </button>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-3 px-4 py-4">
            <CalendarDays className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-foreground appearance-none"
              />
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}
