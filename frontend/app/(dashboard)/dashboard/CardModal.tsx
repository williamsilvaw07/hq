"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Loader2 } from "lucide-react";

export type CreditCard = {
  id: number;
  name: string;
  owner?: string | null;
  credit_limit: number;
  current_balance: number;
  payment_due_day: number;
};

type CardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; owner: string; credit_limit: number; payment_due_day: number }) => Promise<void>;
  onDelete?: (id: number) => void;
  initialData?: CreditCard | null;
  saving: boolean;
};

export function CardModal({ isOpen, onClose, onSave, onDelete, initialData, saving }: CardModalProps) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [limit, setLimit] = useState("");
  const [dueDay, setDueDay] = useState("10");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setOwner(initialData.owner ?? "");
      setLimit(initialData.credit_limit?.toString() ?? "");
      setDueDay(initialData.payment_due_day?.toString() ?? "10");
    } else {
      setName("");
      setOwner("");
      setLimit("");
      setDueDay("10");
    }
  }, [initialData, isOpen]);

  const canSave = !saving && !!name.trim() && !!dueDay;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      subtitle={initialData ? "EDIT CARD" : "NEW CARD"}
      title={name || (initialData ? "Edit Card" : "New Card")}
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
              onClick={() =>
                onSave({
                  name: name.trim(),
                  owner: owner.trim(),
                  credit_limit: parseFloat(limit) || 0,
                  payment_due_day: parseInt(dueDay, 10) || 10,
                })
              }
              disabled={!canSave}
              className="flex-[1.4] py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : initialData ? (
                "Save Changes"
              ) : (
                "Add Card"
              )}
            </button>
          </div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              disabled={saving}
              className="w-full py-2 text-sm font-bold text-chart-2 uppercase tracking-widest text-center active:opacity-70 transition-all disabled:opacity-40"
            >
              Delete Card
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        {/* Card Name */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Card Name</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nubank, Inter, C6…"
            className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/25"
            autoFocus={!initialData}
          />
        </div>

        {/* Card Owner */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Card Owner</p>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Who owns this card?"
            className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/25"
          />
        </div>

        {/* Card Limit */}
        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-5">Card Limit</p>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-2xl font-light text-muted-foreground/30 leading-none">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="text-7xl font-black bg-transparent outline-none text-center w-auto min-w-[80px] max-w-[220px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
            />
          </div>
        </div>

        {/* Due Day */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Due Day (each month)</p>
          <input
            type="number"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            min={1}
            max={31}
            className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/25 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="10"
          />
        </div>
      </div>
    </Modal>
  );
}
