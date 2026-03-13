"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Filter, Search, ShoppingBag, ArrowUpRight, X } from "lucide-react";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  status: string;
  category?: { id: number; name: string };
  account?: { id: number; name: string } | null;
};

type Paginated = { data: Transaction[]; current_page: number; last_page: number; per_page: number };

const DEBOUNCE_MS = 350;

export default function TransactionsPage() {
  const { workspaceId } = useAuth();
  const [result, setResult] = useState<Paginated | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchList = useCallback(() => {
    if (!workspaceId) return;
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search.trim()) params.set("search", search.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    api<Paginated>(`/api/workspaces/${workspaceId}/transactions?${params}`)
      .then((r) => { if (r.data) setResult(r.data); })
      .catch(() => {});
  }, [workspaceId, page, status, typeFilter, search, from, to]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, typeFilter, search, from, to]);

  if (!result) {
    return <div className="text-muted-foreground text-sm py-8">Loading…</div>;
  }

  const filterPills = [
    { id: "all" as const, label: "All Activity" },
    { id: "income" as const, label: "Income" },
    { id: "expense" as const, label: "Expenses" },
  ];

  const list = Array.isArray(result.data) ? result.data : [];
  const byDate = list.reduce<Record<string, Transaction[]>>((acc, t) => {
    const d = t.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4 sm:space-y-6 pb-4">
      <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-md space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Activity History</h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${status || from || to ? "bg-primary/20 text-primary" : "bg-card text-foreground"}`}
            aria-label="Filter"
          >
            <Filter className={`w-5 h-5 ${status || from || to ? "text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
        {filterOpen && (
          <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Filter</span>
              <button type="button" onClick={() => setFilterOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background rounded-xl border border-border px-3 py-2 text-sm text-foreground">
                <option value="">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-background rounded-xl border border-border px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-background rounded-xl border border-border px-3 py-2 text-sm text-foreground" />
              </div>
            </div>
            <button type="button" onClick={() => setFilterOpen(false)} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              Apply
            </button>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-card border border-border rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 pl-10 sm:pl-11 pr-3 sm:pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6">
          {filterPills.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTypeFilter(id)}
              className={`whitespace-nowrap px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all border ${
                typeFilter === id
                  ? "bg-muted text-foreground border-border"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-5 sm:space-y-8">
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center gap-2 sm:gap-3">
            <p className="text-sm font-medium text-foreground">No activity yet for this workspace and filters.</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              Add a transaction or adjust the filters above to see your income and expenses here.
            </p>
            <div className="flex gap-2 mt-2">
              <Link
                href="/transactions/new"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95"
              >
                Add transaction
              </Link>
              <Link
                href="/pending"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-card text-xs font-bold text-foreground border border-border active:scale-95"
              >
                View drafts
              </Link>
            </div>
          </div>
        )}

        {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, list]) => (
          <div key={date} className="space-y-3 sm:space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">{date}</p>
            <div className="space-y-2 sm:space-y-3">
              {list.map((t) => (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between bg-card p-3 sm:p-5 rounded-2xl sm:rounded-3xl group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shrink-0 ${t.type === "income" ? "bg-chart-1/10 border-chart-1/10" : "bg-card"}`}>
                      {t.type === "income" ? <ArrowUpRight className="w-5 h-5 text-chart-1" /> : <ShoppingBag className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.description || "—"}</p>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">{t.category?.name ?? "—"} {t.status === "draft" && "• Draft"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${t.type === "income" ? "text-chart-1" : "text-foreground"}`}>
                      {t.type === "income" ? "+" : "-"}R${" "}
                      {Math.abs(t.amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">{t.account?.name ?? "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {result.last_page > 1 && (
        <div className="flex gap-2 justify-center pt-3 sm:pt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg sm:rounded-xl border border-border px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold disabled:opacity-50">Previous</button>
          <span className="py-2 text-xs text-muted-foreground">Page {result.current_page} of {result.last_page}</span>
          <button type="button" disabled={page >= result.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-lg sm:rounded-xl border border-border px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
