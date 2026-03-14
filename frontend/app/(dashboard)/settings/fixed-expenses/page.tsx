"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Pencil, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  type FixedBill,
  fixedBillsTotal,
  computeNextOccurrence,
  formatBillDisplayDate,
  formatRecurrenceRule,
} from "@/lib/fixed-expenses";
import { FixedBillModal } from "./FixedBillModal";

export default function FixedExpensesPage() {
  const { workspaceId } = useAuth();
  const router = useRouter();
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

  useEffect(() => { fetchBills(); }, [fetchBills]);

  useEffect(() => {
    const onRefresh = () => fetchBills();
    window.addEventListener("fixed-bills-refresh", onRefresh);
    return () => window.removeEventListener("fixed-bills-refresh", onRefresh);
  }, [fetchBills]);

  async function handleDelete(id: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/fixed-bills/${id}`, { method: "DELETE" });
      setBills((prev) => prev.filter((b) => b.id !== id));
      window.dispatchEvent(new Event("fixed-bills-refresh"));
    } catch {
      // ignore
    }
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
    <div className="min-h-screen bg-background">
      {/* Custom header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold flex-1">Fixed Expenses</h1>
        <button
          type="button"
          onClick={() => setModalBill("new")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Bill
        </button>
      </header>

      <div className="px-4 space-y-5 pt-2 pb-10">
        {/* Summary card */}
        <div className="bg-card rounded-2xl p-6 text-center">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
            Monthly Total
          </p>
          <h2 className="text-4xl font-black tracking-tighter text-foreground">
            {formatMoney(monthlyTotal)}
          </h2>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              {bills.length} active bill{bills.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Bills list */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
            Recurring Bills
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl h-28 animate-pulse" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No fixed expenses yet.</p>
              <button
                type="button"
                onClick={() => setModalBill("new")}
                className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
              >
                Add your first bill
              </button>
            </div>
          ) : (
            bills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={() => setModalBill({ ...bill })}
              />
            ))
          )}
        </div>
      </div>

      {modalBill !== null && (
        <FixedBillModal
          initialBill={modalBill === "new" ? null : modalBill}
          onClose={() => setModalBill(null)}
          onSave={handleSave}
          onDelete={typeof modalBill === "object" ? (id) => { handleDelete(id); setModalBill(null); } : undefined}
          saving={saving}
        />
      )}
    </div>
  );
}

function BillCard({
  bill,
  onEdit,
}: {
  bill: FixedBill;
  onEdit: () => void;
}) {
  const next = computeNextOccurrence(bill);
  const nextLabel = next ? formatBillDisplayDate(next) : "—";
  const rule = formatRecurrenceRule(bill);

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      {/* Top section: icon + name + amount */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center shrink-0">
          {bill.icon ? (
            <span className="text-2xl">{bill.icon}</span>
          ) : (
            <Home className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate">{bill.name}</p>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
            {bill.category} · {bill.frequency === "weekly" ? "Weekly" : "Monthly"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-foreground">{formatMoney(bill.amount)}</p>
          {bill.dueSoon && (
            <p className="text-[10px] font-bold text-chart-2 uppercase tracking-widest">Due soon</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] mx-4" />

      {/* Bottom section: next date + edit button */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Next Bill Date
          </p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {nextLabel} · {rule}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-all"
          aria-label={`Edit ${bill.name}`}
        >
          <Pencil className="w-3.5 h-3.5 text-black" />
        </button>
      </div>
    </div>
  );
}
