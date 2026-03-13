"use client";

import { useState, useEffect } from "react";
import {
  type FixedBill,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatBillInputDate,
  formatRecurrenceRule,
  parseBillDate,
} from "@/lib/fixed-expenses";
import { Modal } from "@/components/ui/Modal";

const FIXED_BILL_EMOJI_OPTIONS = [
  "🏠", "💡", "📺", "📱", "💻", "☁️", "🚗", "🏥", "📚", "🛒",
  "💳", "🎮", "✈️", "🍕", "💧", "🔧", "📦",
];

type DraftSetter = React.Dispatch<React.SetStateAction<FixedBill>>;

type RecurringEditorProps = {
  bill: FixedBill;
  setDraft: DraftSetter;
};

function RecurringEditor({ bill, setDraft }: RecurringEditorProps) {
  const startDate = parseBillDate(bill.due);
  const startInputValue = startDate ? formatBillInputDate(startDate) : "";

  return (
    <div className="mt-4 space-y-4 w-full">
      <div className="space-y-5">
        <label className="block">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
            Frequency
          </span>
          <select
            value={bill.frequency}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                frequency: e.target.value === "weekly" ? "weekly" : "monthly",
              }))
            }
            className="w-full min-w-0 max-w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-medium text-foreground min-h-[44px] touch-manipulation"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
            Starts on
          </span>
          <input
            type="date"
            value={startInputValue}
            onChange={(e) => {
              const iso = e.target.value;
              setDraft((prev) => {
                if (!iso) return { ...prev, due: "" };
                const d = new Date(iso + "T00:00:00");
                return {
                  ...prev,
                  due: iso,
                  dayOfMonth: prev.frequency === "monthly" ? (Number.isNaN(d.getTime()) ? prev.dayOfMonth : d.getDate()) : null,
                  dayOfWeek: prev.frequency === "weekly" ? (Number.isNaN(d.getTime()) ? prev.dayOfWeek : d.getDay()) : null,
                };
              });
            }}
            className="w-full min-w-0 max-w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-medium text-foreground min-h-[44px] touch-manipulation"
          />
        </label>

        {bill.frequency === "weekly" && (
          <label className="block">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
              Day of week
            </span>
            <select
              value={bill.dayOfWeek ?? 1}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, dayOfWeek: Number(e.target.value), dayOfMonth: null }))
              }
              className="w-full min-w-0 max-w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-medium text-foreground min-h-[44px] touch-manipulation"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
            Ends on
          </span>
          <input
            type="date"
            value={bill.endDate ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, endDate: e.target.value || null }))
            }
            className="w-full min-w-0 max-w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-medium text-foreground min-h-[44px] touch-manipulation"
          />
        </label>
      </div>
    </div>
  );
}

function RecurringPreview({ bill }: { bill: FixedBill }) {
  const next = computeNextOccurrence(bill);
  const rule = formatRecurrenceRule(bill);
  const nextLabel = next ? formatBillDisplayDate(next) : "No upcoming date";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Next:
        </span>
        <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
          {nextLabel}
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
        {rule}
      </span>
    </div>
  );
}

export type FixedBillModalProps = {
  /** null = add new, FixedBill = edit existing */
  initialBill: FixedBill | null;
  onClose: () => void;
  onSave: (bill: FixedBill) => Promise<boolean>;
  saving: boolean;
};

export function FixedBillModal({ initialBill, onClose, onSave, saving }: FixedBillModalProps) {
  const isNew = !initialBill;
  const today = new Date();
  const defaultDraft: FixedBill = initialBill ?? {
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
  };

  const [draft, setDraft] = useState<FixedBill>(defaultDraft);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSave(draft);
    if (ok) onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? "Add fixed bill" : "Edit fixed bill"}
      size="default"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm active:bg-secondary touch-manipulation min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="fixed-bill-form"
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:bg-primary/90 touch-manipulation min-h-[48px]"
          >
            {saving ? "Saving…" : isNew ? "Add bill" : "Save changes"}
          </button>
        </div>
      }
    >
      <form
        id="fixed-bill-form"
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 min-h-0 min-w-0 space-y-4"
      >
          <div className="grid grid-cols-5 gap-2">
            {FIXED_BILL_EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, icon: prev.icon === emoji ? null : emoji }))
                }
                className={`aspect-square min-w-0 rounded-xl flex items-center justify-center text-xl transition-all touch-manipulation active:scale-95 ${
                  draft.icon === emoji
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-secondary/50 active:bg-secondary"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Bill name"
              className="w-full min-w-0 max-w-full text-base font-bold text-foreground bg-transparent border-b border-border py-2 focus:outline-none focus:ring-0 min-h-[44px]"
            />
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">
              {draft.category} • {draft.frequency === "weekly" ? "Weekly" : "Monthly"}
            </p>
          </div>

          <div>
            <label className="block mb-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Amount (R$)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.amount || ""}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))
              }
              className="w-full min-w-0 max-w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-bold text-foreground min-h-[44px] touch-manipulation"
            />
          </div>

          <RecurringEditor bill={draft} setDraft={setDraft} />
          <RecurringPreview bill={draft} />
      </form>
    </Modal>
  );
}
