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
} from "@/lib/fixed-expenses";

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
      due: `${day}/${month}/${year}`,
      dueSoon: false,
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
                          {display.category} • Monthly
                        </p>
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
                          : `Day ${display.due.split("/")[0]}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        Next date:
                      </span>
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                        {display.due}
                      </span>
                    </div>
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
