"use client";

import { useState } from "react";
import {
  type FixedBill,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatRecurrenceRule,
} from "@/lib/fixed-expenses";
import { Modal } from "@/components/ui/Modal";
import { Loader2, ChevronDown, CalendarDays, RefreshCw, Sparkles } from "lucide-react";

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
  const canSave = !saving && !!draft.name.trim() && draft.amount > 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? "New Fixed Bill" : "Edit Fixed Bill"}
      subtitle={isNew ? "NEW BILL" : "EDIT BILL"}
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
              onClick={async () => {
                const ok = await onSave(draft);
                if (ok) onClose();
              }}
              disabled={!canSave}
              className="flex-1 py-4 rounded-xl bg-white text-black text-sm font-bold active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : isNew ? "Create Bill" : "Save Changes"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 py-1">

        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          {/* Icon picker */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-background border border-white/[0.08] flex items-center justify-center text-3xl">
              {draft.icon || "🏠"}
            </div>
            <select
              value={draft.icon || ""}
              onChange={(e) => setDraft(prev => ({ ...prev, icon: e.target.value }))}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick icon"
            >
              {FIXED_BILL_EMOJI_OPTIONS.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="flex-1 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Bill Name</p>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Rent, Netflix…"
              className="w-full bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/30"
              autoFocus={isNew}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Monthly Amount</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-light text-muted-foreground/40">R$</span>
            <input
              type="number"
              step="0.01"
              value={draft.amount || ""}
              onChange={(e) => setDraft(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
              className="w-full bg-transparent outline-none text-2xl font-bold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/25"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-1">Schedule</p>

          {/* Frequency */}
          <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Frequency</p>
              <select
                value={draft.frequency}
                onChange={(e) => setDraft(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground appearance-none cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />
          </div>

          {/* Start date */}
          <div className="flex items-center gap-3 bg-background border border-white/[0.08] rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <CalendarDays className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">Starts On</p>
              <input
                type="date"
                value={draft.due}
                onChange={(e) => setDraft(prev => ({ ...prev, due: e.target.value }))}
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Recurrence preview */}
        <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5">
          <Sparkles className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-1">Calculated Schedule</p>
            <p className="text-sm font-semibold text-foreground">{recurrenceRule}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Next: {nextOccurrence ? formatBillDisplayDate(nextOccurrence) : "—"}
            </p>
          </div>
        </div>

      </div>
    </Modal>
  );
}
