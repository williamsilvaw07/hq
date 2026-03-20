"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL, formatBRL, formatDate } from "@/lib/format";
import { SkeletonBox } from "@/components/ui/Skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MonthSummary = {
  year: number;
  month: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  fixedBillsTotal: number;
  transactionCount: number;
  topCategories: { name: string; icon: string | null; total: number }[];
};

type MonthDetail = {
  year: number;
  month: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
  fixedBillsTotal: number;
  categories: { name: string; icon: string | null; total: number }[];
  fixedBills: { id: number; name: string; amount: number; icon: string | null; dayOfMonth: number | null }[];
  transactions: {
    id: number;
    type: string;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
    status: string;
    category: { id: number; name: string } | null;
  }[];
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const { workspaceId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const currentYear = new Date().getFullYear();
  const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear;
  const selectedMonth = monthParam ? parseInt(monthParam, 10) : null;

  // State
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [detail, setDetail] = useState<MonthDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Set page title
  useEffect(() => {
    const prev = document.title;
    document.title = "History | NorthTrack";
    return () => { document.title = prev || "NorthTrack"; };
  }, []);

  // Fetch available years on mount
  useEffect(() => {
    if (!workspaceId) return;
    api<any>(`/api/workspaces/${workspaceId}/history`)
      .then((r) => {
        const yrs = (r.data?.years ?? []).map((y: any) => y.year);
        if (!yrs.includes(currentYear)) yrs.push(currentYear);
        yrs.sort((a: number, b: number) => b - a);
        setAvailableYears(yrs);
      })
      .catch(() => {});
  }, [workspaceId, currentYear]);

  // Fetch data based on params
  const fetchData = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);

    if (selectedMonth) {
      // Month detail
      api<MonthDetail>(`/api/workspaces/${workspaceId}/history?year=${selectedYear}&month=${selectedMonth}`)
        .then((r) => { setDetail(r.data ?? null); })
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    } else {
      // Year overview
      api<any>(`/api/workspaces/${workspaceId}/history?year=${selectedYear}`)
        .then((r) => {
          const fetched = r.data?.months ?? [];
          // Ensure we always have 12 months even if API returns partial/empty
          if (fetched.length === 12) {
            setMonths(fetched);
          } else {
            const fallback = Array.from({ length: 12 }, (_, i) => ({
              year: selectedYear,
              month: i + 1,
              label: `${MONTH_SHORT[i]} ${selectedYear}`,
              totalIncome: 0,
              totalExpenses: 0,
              netResult: 0,
              fixedBillsTotal: 0,
              transactionCount: 0,
              topCategories: [],
            }));
            // Merge fetched data into fallback
            for (const m of fetched) {
              const idx = m.month - 1;
              if (idx >= 0 && idx < 12) fallback[idx] = m;
            }
            setMonths(fallback);
          }
        })
        .catch(() => {
          // Show empty month grid on error
          setMonths(Array.from({ length: 12 }, (_, i) => ({
            year: selectedYear,
            month: i + 1,
            label: `${MONTH_SHORT[i]} ${selectedYear}`,
            totalIncome: 0,
            totalExpenses: 0,
            netResult: 0,
            fixedBillsTotal: 0,
            transactionCount: 0,
            topCategories: [],
          })));
        })
        .finally(() => setLoading(false));
    }
  }, [workspaceId, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Navigation helpers
  const goToYear = (y: number) => router.push(`/history?year=${y}`);
  const goToMonth = (m: number) => router.push(`/history?year=${selectedYear}&month=${m}`);
  const goBack = () => {
    if (selectedMonth) {
      router.push(`/history?year=${selectedYear}`);
    } else {
      router.push("/dashboard");
    }
  };

  // ---------------------------------------------------------------------------
  // Month Detail View
  // ---------------------------------------------------------------------------
  if (selectedMonth && !loading) {
    return <MonthDetailView detail={detail} onBack={goBack} />;
  }

  // ---------------------------------------------------------------------------
  // Year + Month Cards View
  // ---------------------------------------------------------------------------
  return (
    <div className="px-5 pt-6 space-y-6 pb-32">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">History</h1>
      </header>

      {/* Year selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => goToYear(selectedYear - 1)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-bold tracking-tight min-w-[60px] text-center">{selectedYear}</span>
        <button
          onClick={() => goToYear(selectedYear + 1)}
          disabled={selectedYear >= currentYear}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Month cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          {months.map((m) => {
            const hasData = m.transactionCount > 0;
            const isCurrentMonth = selectedYear === currentYear && m.month === new Date().getMonth() + 1;
            const isFuture = selectedYear === currentYear && m.month > new Date().getMonth() + 1;

            return (
              <button
                key={m.month}
                onClick={() => hasData ? goToMonth(m.month) : undefined}
                disabled={!hasData}
                className={`text-left p-3.5 rounded-xl transition-all ${
                  hasData
                    ? "bg-card active:scale-[0.98] cursor-pointer"
                    : "bg-card/30 opacity-40 cursor-default"
                } ${isCurrentMonth ? "ring-1 ring-white/20" : ""}`}
              >
                <p className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isCurrentMonth ? "text-white" : "text-muted-foreground/60"
                }`}>
                  {MONTH_SHORT[m.month - 1]}
                </p>

                {hasData ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-black tracking-tight">
                        {CURRENCY_SYMBOL} {formatBRL(m.totalExpenses, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider">spent</p>
                    </div>

                    {m.totalIncome > 0 && (
                      <p className="text-[11px] sm:text-xs text-emerald-400/70">
                        +{CURRENCY_SYMBOL} {formatBRL(m.totalIncome, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} income
                      </p>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] sm:text-xs font-semibold ${m.netResult >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {m.netResult >= 0 ? "+" : ""}{CURRENCY_SYMBOL} {formatBRL(Math.abs(m.netResult), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground/30">net</span>
                    </div>

                    {m.topCategories.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {m.topCategories.slice(0, 2).map((c) => (
                          <span key={c.name} className="text-[10px] sm:text-[11px] bg-white/5 text-muted-foreground/50 rounded px-1.5 py-0.5 truncate max-w-[80px]">
                            {c.icon ?? ""} {c.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] sm:text-[11px] text-muted-foreground/30">{m.transactionCount} transactions</p>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-muted-foreground/30 mt-2">
                    {isFuture ? "Upcoming" : "No data"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month Detail Component
// ---------------------------------------------------------------------------

function MonthDetailView({ detail, onBack }: { detail: MonthDetail | null; onBack: () => void }) {
  if (!detail) {
    return (
      <div className="px-5 pt-6 space-y-6 pb-32">
        <header className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Month Detail</h1>
        </header>
        <div className="text-center py-12">
          <p className="text-muted-foreground/50 text-sm">No data for this month.</p>
        </div>
      </div>
    );
  }

  const maxCatTotal = detail.categories.length > 0 ? Math.max(...detail.categories.map((c) => c.total)) : 0;

  // Group transactions by date
  const txByDate: Record<string, typeof detail.transactions> = {};
  for (const tx of detail.transactions) {
    const d = tx.date;
    if (!txByDate[d]) txByDate[d] = [];
    txByDate[d].push(tx);
  }
  const dateGroups = Object.entries(txByDate).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="px-5 pt-6 space-y-6 pb-32">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{detail.label}</h1>
      </header>

      {/* Summary Card */}
      <section className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-50">Month Summary</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider mb-0.5">Income</p>
            <p className="text-lg font-black tracking-tight text-emerald-400">
              {CURRENCY_SYMBOL} {formatBRL(detail.totalIncome, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider mb-0.5">Expenses</p>
            <p className="text-lg font-black tracking-tight">
              {CURRENCY_SYMBOL} {formatBRL(detail.totalExpenses, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider mb-0.5">Net Result</p>
            <p className={`text-lg font-black tracking-tight ${detail.netResult >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {detail.netResult >= 0 ? "+" : "-"}{CURRENCY_SYMBOL} {formatBRL(Math.abs(detail.netResult), { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider mb-0.5">Fixed Bills</p>
            <p className="text-lg font-black tracking-tight text-chart-1">
              {CURRENCY_SYMBOL} {formatBRL(detail.fixedBillsTotal, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
          <span className="text-[11px] sm:text-xs text-muted-foreground/40 uppercase tracking-wider">{detail.transactionCount} transactions</span>
        </div>
      </section>

      {/* Category Breakdown */}
      {detail.categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-50 px-1">Spending by Category</h2>
          <div className="bg-card rounded-2xl divide-y divide-white/[0.04]">
            {detail.categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3 p-4">
                <span className="text-lg w-7 text-center shrink-0">{cat.icon ?? "📁"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold truncate">{cat.name}</p>
                    <p className="text-xs font-bold shrink-0 ml-2">
                      {CURRENCY_SYMBOL} {formatBRL(cat.total, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all duration-500"
                      style={{ width: maxCatTotal > 0 ? `${Math.max((cat.total / maxCatTotal) * 100, 2)}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fixed Bills */}
      {detail.fixedBills.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-50 px-1">Fixed Bills</h2>
          <div className="bg-card rounded-2xl divide-y divide-white/[0.04]">
            {detail.fixedBills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 p-4">
                <span className="text-lg w-7 text-center shrink-0">{bill.icon ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{bill.name}</p>
                  {bill.dayOfMonth && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground/40">Day {bill.dayOfMonth}</p>
                  )}
                </div>
                <p className="text-xs font-bold shrink-0">
                  {CURRENCY_SYMBOL} {formatBRL(bill.amount, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions */}
      {dateGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-50 px-1">Transactions</h2>
          {dateGroups.map(([date, txs]) => (
            <div key={date} className="space-y-1">
              <p className="text-[11px] sm:text-xs text-muted-foreground/40 uppercase tracking-wider px-1 mb-1.5">{formatDate(date)}</p>
              <div className="bg-card rounded-2xl divide-y divide-white/[0.04]">
                {txs.map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/transactions/${tx.id}`}
                    className="flex items-center gap-3 p-4 active:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "income" ? "bg-emerald-500/10" : "bg-white/5"
                    }`}>
                      <Icon
                        icon={tx.type === "income" ? "solar:wallet-money-bold-duotone" : "solar:card-send-bold-duotone"}
                        className={`text-base ${tx.type === "income" ? "text-emerald-400" : "text-white/40"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{tx.description || "—"}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground/40">{tx.category?.name ?? "Uncategorized"}</p>
                    </div>
                    <p className={`text-xs font-bold shrink-0 ${tx.type === "income" ? "text-emerald-400" : ""}`}>
                      {tx.type === "income" ? "+" : "-"}{CURRENCY_SYMBOL} {formatBRL(tx.amount, { minimumFractionDigits: 2 })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
