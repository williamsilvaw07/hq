"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, Pencil, Trash2, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  type FixedBill,
  fixedBillsTotal,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatRecurrenceRule,
  parseBillDate,
} from "@/lib/fixed-expenses";
import { FixedBillModal } from "./FixedBillModal";

export default function FixedExpensesPage() {
  const { workspaceId } = useAuth();
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalBill, setModalBill] = useState<FixedBill | null | "new">(null);
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

  function openAddModal() {
    setModalBill("new");
  }

  function openEditModal(bill: FixedBill) {
    setModalBill({ ...bill });
  }

  function closeModal() {
    setModalBill(null);
  }

  async function handleSave(bill: FixedBill): Promise<boolean> {
    if (!workspaceId) return false;
    setSaving(true);
    try {
      const isNew = bill.id < 0;
      if (isNew) {
        const r = await api<FixedBill>(`/api/workspaces/${workspaceId}/fixed-bills`, {
          method: "POST",
          body: JSON.stringify({
            name: bill.name || "New bill",
            category: bill.category || "General",
            amount: bill.amount ?? 0,
            icon: bill.icon ?? "🏠",
            due: bill.due,
            frequency: bill.frequency,
            dayOfMonth: bill.dayOfMonth,
            dayOfWeek: bill.dayOfWeek,
            endDate: bill.endDate,
          }),
        });
        if (r.data) {
          setBills((prev) => [...prev, r.data!]);
          window.dispatchEvent(new Event("fixed-bills-refresh"));
          return true;
        }
      } else {
        const updated = await api<FixedBill>(`/api/workspaces/${workspaceId}/fixed-bills/${bill.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: bill.name,
            category: bill.category,
            amount: bill.amount,
            icon: bill.icon,
            due: bill.due,
            frequency: bill.frequency,
            dayOfMonth: bill.dayOfMonth,
            dayOfWeek: bill.dayOfWeek,
            endDate: bill.endDate,
          }),
        });
        if (updated.data) {
          setBills((prev) => prev.map((b) => (b.id === bill.id ? updated.data! : b)));
          window.dispatchEvent(new Event("fixed-bills-refresh"));
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  }

  return (
    <div className="space-y-5 pt-4 pb-8">
      <div className="flex flex-col items-center justify-center py-4 bg-card rounded-lg text-center px-4">
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
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-xs font-bold uppercase tracking-widest text-primary active:bg-primary/20 active:scale-95 transition-all touch-manipulation min-h-[44px]"
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
            bills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={() => openEditModal(bill)}
                onDelete={() => handleDelete(bill.id)}
              />
            ))
          )}
        </div>
      </div>

      {(modalBill === "new" || modalBill) && (
        <FixedBillModal
          initialBill={modalBill === "new" ? null : modalBill}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

function BillCard({
  bill,
  onEdit,
  onDelete,
}: {
  bill: FixedBill;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const next = computeNextOccurrence(bill);
  const rule = formatRecurrenceRule(bill);
  const nextLabel = next ? formatBillDisplayDate(next) : "No upcoming date";

  return (
    <div className="bg-card p-4 rounded-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            {bill.icon ? (
              <span className="text-xl">{bill.icon}</span>
            ) : (
              <Home className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{bill.name}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
              {bill.category} • {bill.frequency === "weekly" ? "Weekly" : "Monthly"}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-foreground">{formatMoney(bill.amount)}</p>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${bill.dueSoon ? "text-chart-2" : "text-muted-foreground"}`}>
            {bill.dueSoon ? "Due in 5 days" : bill.frequency === "weekly" && bill.dayOfWeek !== null
              ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][bill.dayOfWeek]}`
              : (() => {
                  const parsed = parseBillDate(bill.due);
                  return parsed ? `Day ${parsed.getDate()}` : "Day --";
                })()}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
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
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onEdit}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-secondary flex items-center justify-center active:bg-secondary/80 transition-colors touch-manipulation"
            aria-label="Edit recurring bill"
          >
            <Pencil className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-chart-2/10 flex items-center justify-center active:bg-chart-2/20 transition-colors touch-manipulation"
            aria-label={`Delete ${bill.name}`}
          >
            <Trash2 className="w-5 h-5 text-chart-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
