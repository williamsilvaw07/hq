"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatNumberUK } from "@/lib/format";
import { Settings, ShoppingBag, PenLine } from "lucide-react";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  status: string;
  category?: { id: number; name: string };
  account_id: number | null;
  created_at?: string;
};

export default function PendingPage() {
  const { workspaceId } = useAuth();
  const [list, setList] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    api<Transaction[]>(`/api/workspaces/${workspaceId}/transactions/pending`)
      .then((r) => setList(r.data || []))
      .catch(() => {});
  }, [workspaceId]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-4">
      <header className="z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Pending Review</h1>
          <p className="text-[11px] text-chart-1 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-1 animate-pulse" />
            {list.length} Transaction{list.length !== 1 ? "s" : ""} captured
          </p>
        </div>
        <Link href="/settings" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95" aria-label="Settings">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>
      <main className="space-y-4">
        {list.length === 0 ? (
          <div className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm">No pending transactions.</p>
            <p className="text-[11px] text-muted-foreground mt-2">Send a message via WhatsApp to record an expense or income.</p>
          </div>
        ) : (
          list.map((t) => (
            <div key={t.id} className="bg-card p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-chart-2/10 border border-chart-2/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.description || "—"}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {t.date}
                  {t.created_at && ` · ${new Date(t.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                  {" · "}{t.category?.name ?? "—"}
                </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-sm font-bold ${t.type === "income" ? "text-chart-1" : "text-foreground"}`}>
                  {t.type === "income" ? "+" : "-"}R${" "}
                  {formatNumberUK(Math.abs(t.amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <Link href={`/transactions/${t.id}`} className="flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-primary text-primary-foreground px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold shadow-lg shadow-white/5 active:scale-95 transition-all shrink-0">
                  <PenLine className="w-3.5 h-3.5" /> Confirm / Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
