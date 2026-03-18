"use client";

import { useState } from "react";
import {
  type FixedBill,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatRecurrenceRule,
} from "@/lib/fixed-expenses";
import { Modal } from "@/components/ui/Modal";
import { Loader2, Pencil, RefreshCw, CalendarDays, Sparkles } from "lucide-react";

const FIXED_BILL_EMOJI_OPTIONS = [
  "🏠", "💡", "📺", "📱", "💻", "☁️", "🚗", "🏥", "📚", "🛒",
  "💳", "🎮", "✈️", "🍕", "💧", "🔧", "📦",
];

export function FixedBillModal({ initialBill, onClose, onSave, onDelete, saving }: {
  initialBill: FixedBill | null;
  onClose: () => void;
  onSave: (bill: FixedBill) => Promise<boolean>;
  onDelete?: (id: number) => void;
  saving: boolean;
}) {
  const isNew = !initialBill;
  const today = new Date();
  const [draft, setDraft] = useState<FixedBill>(initialBill ?? {
    id: -1, name: "", category: "General", amount: 0, icon: "🏠",
    due: today.toISOString().slice(0, 10), dueSoon: false,
    frequency: "monthly", dayOfMonth: today.getDate(), dayOfWeek: null, endDate: null,
  });

  const nextOccurrence = computeNextOccurrence(draft);
  const recurrenceRule = formatRecurrenceRule(draft);
  const canSave = !saving && !!draft.name.trim() && draft.amount > 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      subtitle={isNew ? "NEW BILL" : "EDIT BILL"}
      title={draft.name || (isNew ? "New Fixed Bill" : "Edit Fixed Bill")}
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
              onClick={async () => { const ok = await onSave(draft); if (ok) onClose(); }}
              disabled={!canSave}
              className="flex-[1.4] py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : isNew ? "Create Bill" : "Save Changes"}
            </button>
          </div>
          {!isNew && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(draft.id)}
              disabled={saving}
              className="w-full py-2 text-sm font-bold text-chart-2 uppercase tracking-widest text-center active:opacity-70 transition-all disabled:opacity-40"
            >
              Delete Bill
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-2">

        {/* Icon + Name */}
        <div className="flex items-center gap-4 border border-white/[0.08] rounded-2xl p-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex flex-col items-center justify-center gap-0.5">
              <span className="text-3xl leading-none">{draft.icon || "🏠"}</span>
              <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">Emoji</span>
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md pointer-events-none">
              <Pencil className="w-2.5 h-2.5 text-black" />
            </div>
            <select
              value={draft.icon || ""}
              onChange={(e) => setDraft(prev => ({ ...prev, icon: e.target.value }))}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick icon"
            >
              {FIXED_BILL_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Bill Name</p>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Rent, Netflix…"
              className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/25"
              autoFocus={isNew}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-2">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3">Monthly Amount</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-lg font-light text-muted-foreground/30 leading-none">R$</span>
            <input
              type="number"
              step="0.01"
              value={draft.amount || ""}
              onChange={(e) => setDraft(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
              className="text-4xl font-black bg-transparent outline-none text-center w-auto min-w-[60px] max-w-[200px] tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
              placeholder="0"
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Frequency</p>
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/30" />
          </div>
          <div className="grid grid-cols-2 bg-black/30 p-1 rounded-full gap-1">
            {[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraft(prev => {
                  const d = prev.due ? new Date(prev.due + "T00:00:00") : new Date();
                  return {
                    ...prev,
                    frequency: value as any,
                    dayOfMonth: d.getDate(),
                    dayOfWeek: d.getDay(),
                  };
                })}
                className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  draft.frequency === value ? "bg-white text-black shadow-sm" : "text-muted-foreground/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Start date + preview */}
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-4">
            <CalendarDays className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Starts On</p>
              <input
                type="date"
                value={draft.due}
                onChange={(e) => {
                  const picked = e.target.value;
                  if (!picked) return;
                  const d = new Date(picked + "T00:00:00");
                  setDraft(prev => ({
                    ...prev,
                    due: picked,
                    dayOfMonth: d.getDate(),
                    dayOfWeek: d.getDay(),
                  }));
                }}
                className="w-full bg-transparent outline-none text-sm font-semibold text-foreground appearance-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Sparkles className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Next Occurrence</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={nextOccurrence ? nextOccurrence.toISOString().slice(0, 10) : ""}
                  onChange={(e) => {
                    const picked = e.target.value;
                    if (!picked) return;
                    const d = new Date(picked + "T00:00:00");
                    setDraft(prev => ({
                      ...prev,
                      due: picked,
                      dayOfMonth: d.getDate(),
                      dayOfWeek: d.getDay(),
                    }));
                  }}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground appearance-none"
                />
                <span className="text-sm text-muted-foreground/50 shrink-0">· {recurrenceRule}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
