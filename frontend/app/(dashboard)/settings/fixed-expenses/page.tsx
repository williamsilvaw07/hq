"use client";

import { useEffect, useState } from "react";
import { Home, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import {
  MOCK_FIXED_BILLS,
  type FixedBill,
  fixedBillsTotal,
  loadFixedBills,
  saveFixedBills,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatBillInputDate,
  formatRecurrenceRule,
  parseBillDate,
} from "@/lib/fixed-expenses";

type DraftSetter = React.Dispatch<React.SetStateAction<FixedBill | null>>;

type RecurringEditorProps = {
  bill: FixedBill;
  originalId: number;
  setDraft: DraftSetter;
};

function RecurringEditor({ bill, originalId, setDraft }: RecurringEditorProps) {
  const startDate = parseBillDate(bill.due);
  const startInputValue = startDate ? formatBillInputDate(startDate) : "";

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Frequency</span>
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
          className="bg-background border border-border rounded-lg px-2 py-1"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Starts on</span>
        <input
          type="date"
          value={startInputValue}
          onChange={(e) => {
            const iso = e.target.value;
            setDraft((prev) => {
              if (!prev || prev.id !== originalId) return prev;
              if (!iso) {
                return { ...prev, due: "" };
              }
              const d = new Date(iso + "T00:00:00");
              if (Number.isNaN(d.getTime())) {
                return { ...prev, due: iso };
              }
              return {
                ...prev,
                due: iso,
                dayOfMonth: prev.frequency === "monthly" ? d.getDate() : prev.dayOfMonth,
                dayOfWeek: prev.frequency === "weekly" ? d.getDay() : prev.dayOfWeek,
              };
            });
          }}
          className="bg-background border border-border rounded-lg px-2 py-1"
        />
      </label>

      {bill.frequency === "monthly" ? (
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Day of month</span>
          <input
            type="number"
            min={1}
            max={31}
            value={bill.dayOfMonth ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDraft((prev) =>
                prev && prev.id === originalId
                  ? {
                      ...prev,
                      dayOfMonth:
                        Number.isNaN(value) || value <= 0 || value > 31
                          ? prev.dayOfMonth
                          : value,
                      dayOfWeek: null,
                    }
                  : prev,
              );
            }}
            className="w-14 bg-background border border-border rounded-lg px-2 py-1 text-right"
          />
        </label>
      ) : (
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Day of week</span>
          <select
            value={bill.dayOfWeek ?? 1}
            onChange={(e) =>
              setDraft((prev) =>
                prev && prev.id === originalId
                  ? {
                      ...prev,
                      dayOfWeek: Number(e.target.value),
                      dayOfMonth: null,
                    }
                  : prev,
              )
            }
            className="bg-background border border-border rounded-lg px-2 py-1"
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

      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Ends on</span>
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
          className="bg-background border border-border rounded-lg px-2 py-1"
        />
      </label>
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
  const [bills, setBills] = useState<FixedBill[]>(MOCK_FIXED_BILLS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FixedBill | null>(null);
  const monthlyTotal = fixedBillsTotal(bills);

  useEffect(() => {
    setBills(loadFixedBills(workspaceId ?? null));
  }, [workspaceId]);

  useEffect(() => {
    saveFixedBills(workspaceId ?? null, bills);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fixed-bills-refresh"));
    }
  }, [workspaceId, bills]);

  function handleDelete(id: number) {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  }

  function handleAdd() {
    const nextId =
      bills.length > 0 ? Math.max(...bills.map((bill) => bill.id)) + 1 : 1;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const newBill: FixedBill = {
      id: nextId,
      name: "New bill",
      category: "General",
      amount: 0,
      // Store next date in ISO so it works well with <input type="date" />
      due: `${year}-${month}-${day}`,
      dueSoon: false,
      frequency: "monthly",
      dayOfMonth: today.getDate(),
      dayOfWeek: null,
      endDate: null,
    };
    setBills((prev) => [...prev, newBill]);
    setEditingId(newBill.id);
    setDraft(newBill);
  }

  function startEdit(bill: FixedBill) {
    setEditingId(bill.id);
    setDraft({ ...bill });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    setBills((prev) => prev.map((bill) => (bill.id === draft.id ? draft : bill)));
    setEditingId(null);
    setDraft(null);
  }

  return (
    <div className="space-y-8 pt-6">
      <div className="flex flex-col items-center justify-center py-6 bg-card rounded-[2.5rem] text-center px-8">
        <p className="section-title mb-2">Monthly Total</p>
        <h2 className="text-3xl font-bold tracking-tighter">
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
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add bill
          </button>
        </div>
        <div className="space-y-4">
          {bills.length === 0 ? (
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
                  className="bg-card p-6 rounded-[2rem] space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                        <Home className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        {isEditing ? (
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
                            className="text-sm font-bold text-foreground bg-transparent border-b border-border focus:outline-none"
                          />
                        ) : (
                          <p className="text-sm font-bold text-foreground">
                            {display.name}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                          {display.category} •{" "}
                          {display.frequency === "weekly" ? "Weekly" : "Monthly"}
                        </p>
                        {isEditing && (
                          <RecurringEditor bill={display} originalId={bill.id} setDraft={setDraft} />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={display.amount}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev && prev.id === bill.id
                                ? { ...prev, amount: Number(e.target.value) || 0 }
                                : prev,
                            )
                          }
                          className="text-lg font-bold text-foreground bg-transparent border-b border-border text-right focus:outline-none"
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">
                          {formatMoney(display.amount)}
                        </p>
                      )}
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          display.dueSoon ? "text-chart-2" : "text-muted-foreground"
                        }`}
                      >
                        {display.dueSoon
                          ? "Due in 5 days"
                          : display.frequency === "weekly" && display.dayOfWeek !== null
                            ? `Every ${
                                ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
                                  display.dayOfWeek
                                ]
                              }`
                            : display.dayOfMonth
                              ? `Day ${display.dayOfMonth}`
                              : `Day ${display.due.split("/")[0]}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <RecurringPreview bill={display} />
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                            aria-label="Save"
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                            aria-label="Cancel"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(bill)}
                            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                            aria-label="Edit recurring bill"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(bill.id)}
                            className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center hover:bg-chart-2/20 transition-colors"
                            aria-label={`Delete ${bill.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-chart-2" />
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
