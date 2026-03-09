"use client";

import { useState } from "react";
import { Home, Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { MOCK_FIXED_BILLS, type FixedBill, fixedBillsTotal } from "@/lib/fixed-expenses";

export default function FixedExpensesPage() {
  const [bills, setBills] = useState<FixedBill[]>(MOCK_FIXED_BILLS);
  const monthlyTotal = fixedBillsTotal(bills);

  function handleDelete(id: number) {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
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
        <h3 className="section-title px-1">Active Recurring Bills</h3>
        <div className="space-y-4">
          {bills.map((bill) => (
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
                    <p className="text-sm font-bold text-foreground">{bill.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                      {bill.category} • Monthly
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{formatMoney(bill.amount)}</p>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      bill.dueSoon ? "text-chart-2" : "text-muted-foreground"
                    }`}
                  >
                    {bill.dueSoon ? "Due in 5 days" : `Day ${bill.due.split("/")[0]}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Next date:
                  </span>
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                    {bill.due}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    title="Edit recurring bill (coming soon)"
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center opacity-60 cursor-not-allowed"
                    aria-label="Edit (coming soon)"
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
