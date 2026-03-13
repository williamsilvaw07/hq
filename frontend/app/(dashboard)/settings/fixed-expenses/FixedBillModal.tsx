"use client";

import { useState } from "react";
import {
  type FixedBill,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatBillInputDate,
  formatRecurrenceRule,
  parseBillDate,
} from "@/lib/fixed-expenses";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@iconify/react";

const FIXED_BILL_EMOJI_OPTIONS = [
  "🏠", "💡", "📺", "📱", "💻", "☁️", "🚗", "🏥", "📚", "🛒",
  "💳", "🎮", "✈️", "🍕", "💧", "🔧", "📦",
];

export function FixedBillModal({ initialBill, onClose, onSave, saving }: {
  initialBill: FixedBill | null;
  onClose: () => void;
  onSave: (bill: FixedBill) => Promise<boolean>;
  saving: boolean;
}) {
  const isNew = !initialBill;
  const today = new Date();
  const [draft, setDraft] = useState<FixedBill>(initialBill ?? {
    id: -1,
    name: "",
    category: "General",
    amount: 0,
    icon: "🏠",
    due: today.toISOString().slice(0, 10),
    dueSoon: false,
    frequency: "monthly",
    dayOfMonth: today.getDate(),
    dayOfWeek: null,
    endDate: null,
  });

  const nextOccurrence = computeNextOccurrence(draft);
  const recurrenceRule = formatRecurrenceRule(draft);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? "New Fixed Bill" : "Edit Fixed Bill"}
      subtitle="SUBSCRIPTIONS"
      showCloseButton={true}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-lg text-xs font-black uppercase tracking-widest text-muted-foreground active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await onSave(draft);
              if (ok) onClose();
            }}
            disabled={saving || !draft.name || !draft.amount}
            className="flex-1 py-4 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "Saving..." : "Confirm Bill"}
          </button>
        </div>
      }
    >
      <div className="space-y-8 py-2">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center text-3xl shadow-inner">
              {draft.icon || "🏠"}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Bill Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Rent, Netflix..."
                className="w-full bg-transparent border-none outline-none text-xl font-bold text-foreground placeholder:text-muted-foreground/30 ring-0 p-0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Monthly Amount</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-light text-muted-foreground/30">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={draft.amount || ""}
                  onChange={(e) => setDraft(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground ring-0 p-0"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Icon</p>
              <select
                value={draft.icon || ""}
                onChange={(e) => setDraft(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground appearance-none ring-0 p-0"
              >
                {FIXED_BILL_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-card/50 rounded-xl overflow-hidden divide-y divide-border/5">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-sm">⏱</div>
              <span className="text-xs font-bold">Frequency</span>
            </div>
            <select
              value={draft.frequency}
              onChange={(e) => setDraft(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="bg-transparent border-none outline-none text-[10px] font-black text-primary uppercase tracking-widest appearance-none text-right"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-sm">📅</div>
              <span className="text-xs font-bold">Starts on</span>
            </div>
            <input
              type="date"
              value={draft.due}
              onChange={(e) => setDraft(prev => ({ ...prev, due: e.target.value }))}
              className="bg-transparent border-none outline-none text-[10px] font-black text-foreground uppercase tracking-widest text-right"
            />
          </div>
          <div className="p-4 bg-secondary/10">
            <div className="flex items-center justify-between">
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Calculated Recurrence</p>
              <p className="text-[9px] font-black text-foreground uppercase tracking-widest">{recurrenceRule}</p>
            </div>
            <p className="text-[10px] font-bold text-foreground mt-1">
              Next: {nextOccurrence ? formatBillDisplayDate(nextOccurrence) : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
