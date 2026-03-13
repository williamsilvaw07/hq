"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  type FixedBill,
  fixedBillsTotal,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatBillInputDate,
  formatRecurrenceRule,
  parseBillDate,
} from "@/lib/fixed-expenses";

type DraftSetter = React.Dispatch<React.SetStateAction<FixedBill | null>>;

const FIXED_BILL_EMOJI_OPTIONS = [
  "🏠", "💡", "📺", "📱", "💻", "☁️", "🚗", "🏥", "📚", "🛒",
  "💳", "🎮", "✈️", "🍕", "💧", "🔧", "📦",
];

type RecurringEditorProps = {
  bill: FixedBill;
  originalId: number;
  setDraft: DraftSetter;
};

function RecurringEditor({ bill, originalId, setDraft }: RecurringEditorProps) {
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
              setDraft((prev) =>
                prev && prev.id === originalId
                  ? {
                      ...prev,
                      frequency: e.target.value === "weekly" ? "weekly" : "monthly",
                    }
                  : prev,
              )
              }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
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
                if (!prev || prev.id !== originalId) return prev;
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
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
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
                setDraft((prev) =>
                  prev && prev.id === originalId
                    ? { ...prev, dayOfWeek: Number(e.target.value), dayOfMonth: null }
                    : prev,
                )
              }
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
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
              setDraft((prev) =>
                prev && prev.id === originalId
                  ? { ...prev, endDate: e.target.value || null }
                  : prev,
              )
            }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
          />
        </label>
      </div>
    </div>
  );
}

type RecurringPreviewProps = {
  bill: FixedBill;
};

function RecurringPreview({ bill }: RecurringPreviewProps) {
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

export default function FixedExpensesPage() {
  const { workspaceId } = useAuth();
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FixedBill | null>(null);
  const [saving, setSaving] = useState(false);
  const monthlyTotal = fixedBillsTotal(bills);

  const fetchBills = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    api<FixedBill[]>(`/api/workspaces/${workspaceId}/fixed-bills`)
      .then((r) => setBills(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onRefresh = () => fetchBills();
      window.addEventListener("fixed-bills-refresh", onRefresh);
      return () => window.removeEventListener("fixed-bills-refresh", onRefresh);
    }
  }, [fetchBills]);

  async function handleDelete(id: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/fixed-bills/${id}`, { method: "DELETE" });
      setBills((prev) => prev.filter((bill) => bill.id !== id));
      window.dispatchEvent(new Event("fixed-bills-refresh"));
    } catch {
      // ignore
    }
  }

  async function handleAdd() {
    if (!workspaceId) return;
    const today = new Date();
    const due = today.toISOString().slice(0, 10);
    setSaving(true);
    try {
      const r = await api<FixedBill>(`/api/workspaces/${workspaceId}/fixed-bills`, {
        method: "POST",
        body: JSON.stringify({
          name: "New bill",
          category: "General",
          amount: 0,
          icon: "🏠",
          due,
          frequency: "monthly",
          dayOfMonth: today.getDate(),
          dayOfWeek: null,
          endDate: null,
        }),
      });
      const newBill = r.data;
      if (newBill) {
        setBills((prev) => [...prev, newBill]);
        setEditingId(newBill.id);
        setDraft(newBill);
        window.dispatchEvent(new Event("fixed-bills-refresh"));
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function startEdit(bill: FixedBill) {
    setEditingId(bill.id);
    setDraft({ ...bill });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit() {
    if (!draft || !workspaceId) return;
    setSaving(true);
    try {
      const updated = await api<FixedBill>(`/api/workspaces/${workspaceId}/fixed-bills/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name,
          category: draft.category,
          amount: draft.amount,
          icon: draft.icon,
          due: draft.due,
          frequency: draft.frequency,
          dayOfMonth: draft.dayOfMonth,
          dayOfWeek: draft.dayOfWeek,
          endDate: draft.endDate,
        }),
      });
      if (updated.data) {
        setBills((prev) => prev.map((bill) => (bill.id === draft.id ? updated.data! : bill)));
        window.dispatchEvent(new Event("fixed-bills-refresh"));
      }
      setEditingId(null);
      setDraft(null);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pt-4 pb-8">
      <div className="flex flex-col items-center justify-center py-4 bg-card rounded-2xl text-center px-4">
        <p className="section-title mb-2">Monthly Total</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter">
          {formatMoney(monthlyTotal)}
        </h2>
        <p className="text-[9px] text-chart-1 font-bold uppercase tracking-widest mt-2 px-3 py-1 bg-chart-1/5 rounded-full border border-chart-1/10">
          {bills.length} active fixed bill{bills.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="section-title">Active Recurring Bills</h3>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-xs font-bold uppercase tracking-widest text-primary active:bg-primary/20 active:scale-95 transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <Plus className="w-3 h-3" />
            Add bill
          </button>
        </div>
        <div className="space-y-4">
          {loading ? (
            <p className="text-xs text-muted-foreground px-1">Loading…</p>
          ) : bills.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              You do not have any fixed expenses yet. Add one to see it here.
            </p>
          ) : (
            bills.map((bill) => {
              const isEditing = editingId === bill.id;
              const display = isEditing && draft ? draft : bill;
              return (
                <div
                  key={bill.id}
                  className="bg-card p-4 rounded-2xl space-y-4"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-2">
                        {FIXED_BILL_EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              setDraft((prev) =>
                                prev && prev.id === bill.id
                                  ? { ...prev, icon: display.icon === emoji ? null : emoji }
                                  : prev,
                              )
                            }
                            className={`aspect-square min-w-0 rounded-xl flex items-center justify-center text-xl transition-all touch-manipulation active:scale-95 ${
                              display.icon === emoji
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
                          value={display.name}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev && prev.id === bill.id
                                ? { ...prev, name: e.target.value }
                                : prev,
                            )
                          }
                          placeholder="Bill name"
                          className="w-full text-base font-bold text-foreground bg-transparent border-b border-border py-2 focus:outline-none focus:ring-0"
                        />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">
                          {display.category} • {display.frequency === "weekly" ? "Weekly" : "Monthly"}
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
                          value={display.amount || ""}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev && prev.id === bill.id
                                ? { ...prev, amount: Number(e.target.value) || 0 }
                                : prev,
                            )
                          }
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base font-bold text-foreground min-h-[44px] touch-manipulation"
                        />
                      </div>
                      <RecurringEditor bill={display} originalId={bill.id} setDraft={setDraft} />
                      <RecurringPreview bill={display} />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          {display.icon ? (
                            <span className="text-xl">{display.icon}</span>
                          ) : (
                            <Home className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{display.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            {display.category} • {display.frequency === "weekly" ? "Weekly" : "Monthly"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-foreground">{formatMoney(display.amount)}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${display.dueSoon ? "text-chart-2" : "text-muted-foreground"}`}>
                          {display.dueSoon ? "Due in 5 days" : display.frequency === "weekly" && display.dayOfWeek !== null
                            ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][display.dayOfWeek]}`
                            : (() => {
                                const parsed = parseBillDate(display.due);
                                return parsed ? `Day ${parsed.getDate()}` : "Day --";
                              })()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    {!isEditing && <RecurringPreview bill={display} />}
                    <div className="flex items-center gap-2 ml-auto">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={saving}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-primary/20 flex items-center justify-center active:bg-primary/30 transition-colors disabled:opacity-50 touch-manipulation"
                            aria-label="Save"
                          >
                            <Check className="w-5 h-5 text-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-secondary flex items-center justify-center active:bg-secondary/80 transition-colors touch-manipulation"
                            aria-label="Cancel"
                          >
                            <X className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(bill)}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-secondary flex items-center justify-center active:bg-secondary/80 transition-colors touch-manipulation"
                            aria-label="Edit recurring bill"
                          >
                            <Pencil className="w-5 h-5 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(bill.id)}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-chart-2/10 flex items-center justify-center active:bg-chart-2/20 transition-colors touch-manipulation"
                            aria-label={`Delete ${bill.name}`}
                          >
                            <Trash2 className="w-5 h-5 text-chart-2" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
