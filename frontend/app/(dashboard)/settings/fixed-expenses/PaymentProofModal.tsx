"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/format";
import { buildMediaUrl } from "@/lib/api";
import type { FixedBill } from "@/lib/fixed-expenses";
import type { BillPayment } from "@/lib/bill-payments";
import { formatPeriod } from "@/lib/bill-payments";
import {
  Loader2,
  Upload,
  FileText,
  Check,
  CalendarRange,
  X,
  ExternalLink,
  Trash2,
  Camera,
  Receipt,
  TrendingUp,
  StickyNote,
  User,
  Lock,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

type Props = {
  bill: FixedBill;
  workspaceId: number;
  onClose: () => void;
};

export function PaymentProofModal({ bill, workspaceId, onClose }: Props) {
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"history" | "new">("new");

  const today = new Date();
  const [periodMonth, setPeriodMonth] = useState(today.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(today.getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const hasAccountInfo = !!(bill.notes || bill.loginEmail || bill.loginPassword);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/workspaces/${workspaceId}/fixed-bills/${bill.id}/payments`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setPayments(Array.isArray(json.data) ? json.data : []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, bill.id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    if (picked && picked.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(picked));
    } else {
      setPreview(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("amount", String(bill.amount));
      form.append("paidAt", today.toISOString().slice(0, 10));
      form.append("periodMonth", String(periodMonth));
      form.append("periodYear", String(periodYear));
      if (file) form.append("proof", file);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/fixed-bills/${bill.id}/payments`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (res.ok) {
        clearFile();
        await fetchPayments();
        setTab("history");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(paymentId: number) {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `/api/workspaces/${workspaceId}/fixed-bills/${bill.id}/payments/${paymentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch {
      // ignore
    }
  }

  const currentMonthPaid = payments.some(
    (p) => p.periodMonth === today.getMonth() + 1 && p.periodYear === today.getFullYear(),
  );

  // Stats
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const withProof = payments.filter((p) => !!p.proofUrl).length;

  // Group payments by period (month/year)
  const grouped = useMemo(() => {
    const map = new Map<string, BillPayment[]>();
    for (const p of payments) {
      const key = `${p.periodYear}-${String(p.periodMonth).padStart(2, "0")}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    // Sort by key descending (newest first)
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [payments]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      subtitle={bill.icon ? `${bill.icon} ${bill.category}` : bill.category}
      title={bill.name}
      footer={
        tab === "new" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
            ) : (
              <><Check className="w-4 h-4" />Record Payment</>
            )}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-5 pb-2">
        {/* Amount + status hero */}
        <div className="bg-white/[0.03] rounded-2xl p-5 text-center">
          <p className="text-3xl font-black tracking-tight text-foreground">
            {formatMoney(bill.amount)}
          </p>
          <div className="mt-3">
            {currentMonthPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" /> Paid this month
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Pending payment
              </span>
            )}
          </div>
        </div>

        {/* Notes & Account Info */}
        {hasAccountInfo && (
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {/* Notes */}
            {bill.notes && (
              <div className="flex items-start gap-3 px-4 py-4">
                <StickyNote className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{bill.notes}</p>
                </div>
              </div>
            )}

            {/* Email / Username */}
            {bill.loginEmail && (
              <div className="flex items-center gap-3 px-4 py-4">
                <User className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Email / Username</p>
                  <p className="text-sm font-semibold text-foreground truncate">{bill.loginEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bill.loginEmail!, "email")}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-90 transition-all shrink-0"
                  title="Copy email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground/50" />
                  )}
                </button>
              </div>
            )}

            {/* Password */}
            {bill.loginPassword && (
              <div className="flex items-center gap-3 px-4 py-4">
                <Lock className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Password</p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {showPassword ? bill.loginPassword : "••••••••"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-90 transition-all"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bill.loginPassword!, "password")}
                    className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-90 transition-all"
                    title="Copy password"
                  >
                    {copiedField === "password" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-black/30 p-1 rounded-full gap-1">
          {[
            { value: "new" as const, label: "Record Payment" },
            { value: "history" as const, label: `History${payments.length > 0 ? ` (${payments.length})` : ""}` },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                tab === value ? "bg-white text-black shadow-sm" : "text-muted-foreground/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <div className="space-y-4">
            {/* Billing Period */}
            <div className="border border-white/[0.08] rounded-2xl px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <CalendarRange className="w-4 h-4 text-muted-foreground/40" />
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Billing Period
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(parseInt(e.target.value, 10))}
                  className="bg-white/[0.06] rounded-xl px-3 py-3 outline-none text-base font-semibold text-foreground appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString("en", { month: "long" })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={periodYear}
                  onChange={(e) => setPeriodYear(parseInt(e.target.value, 10) || today.getFullYear())}
                  className="bg-white/[0.06] rounded-xl px-3 py-3 outline-none text-base font-semibold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Receipt upload */}
            <div className="border border-white/[0.08] rounded-2xl px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Camera className="w-4 h-4 text-muted-foreground/40" />
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Attach Receipt
                </p>
              </div>

              {file ? (
                <div className="space-y-3">
                  {preview ? (
                    <div className="rounded-xl overflow-hidden bg-black/20">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="w-full max-h-52 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04]">
                      <FileText className="w-5 h-5 text-muted-foreground/50" />
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearFile}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-chart-2 uppercase tracking-wider active:opacity-70"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-xl border-2 border-dashed border-white/[0.12] active:border-white/[0.25] transition-colors flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                      Tap to upload receipt
                    </p>
                    <p className="text-[10px] text-muted-foreground/30 mt-1">
                      Photo, screenshot, or PDF — max 5MB
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          /* History tab */
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/40 mb-4">No payments recorded yet</p>
                <button
                  type="button"
                  onClick={() => setTab("new")}
                  className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  Record first payment
                </button>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1">
                      Total Paid
                    </p>
                    <p className="text-sm font-black text-foreground tracking-tight">
                      {formatMoney(totalPaid)}
                    </p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1">
                      Payments
                    </p>
                    <p className="text-sm font-black text-foreground tracking-tight">
                      {payments.length}
                    </p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1">
                      Receipts
                    </p>
                    <p className="text-sm font-black text-foreground tracking-tight">
                      {withProof}/{payments.length}
                    </p>
                  </div>
                </div>

                {/* Grouped by month */}
                {grouped.map(([key, monthPayments]) => {
                  const first = monthPayments[0];
                  return (
                    <div key={key} className="space-y-2">
                      <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider px-1">
                        {formatPeriod(first.periodMonth, first.periodYear)}
                      </p>
                      {monthPayments.map((payment) => (
                        <PaymentHistoryCard
                          key={payment.id}
                          payment={payment}
                          onDelete={() => handleDelete(payment.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function PaymentHistoryCard({
  payment,
  onDelete,
}: {
  payment: BillPayment;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasProof = !!payment.proofUrl;
  const isPdf = payment.proofUrl?.endsWith(".pdf");
  const proofSrc = hasProof ? buildMediaUrl(payment.proofUrl!) : null;

  // Format paid_at safely — handle both string and Date-like values
  const paidAtDisplay = (() => {
    if (!payment.paidAt) return "—";
    const s = String(payment.paidAt);
    // If it looks like ISO datetime, take just the date
    if (s.length > 10) return s.slice(0, 10);
    return s;
  })();

  return (
    <div className="bg-white/[0.04] rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {formatMoney(payment.amount)}
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
            Paid {paidAtDisplay}
            {payment.paidByName ? ` · ${payment.paidByName}` : ""}
            {payment.source !== "web" ? ` · via ${payment.source}` : ""}
          </p>
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="px-3 py-1.5 rounded-full bg-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider active:scale-95 transition-all"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center active:scale-90 transition-all"
            title="Delete payment"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground/30" />
          </button>
        )}
      </div>

      {/* Proof — always visible if exists */}
      {hasProof && (
        <div className="px-4 pb-4">
          {isPdf ? (
            <a
              href={proofSrc!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {payment.proofFilename ?? "Receipt.pdf"}
                </p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">Tap to open PDF</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            </a>
          ) : (
            <a
              href={proofSrc!}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden bg-black/20 active:opacity-90 transition-opacity"
            >
              <img
                src={proofSrc!}
                alt="Payment receipt"
                className="w-full max-h-56 object-contain"
                loading="lazy"
              />
            </a>
          )}
        </div>
      )}

      {/* No proof indicator */}
      {!hasProof && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/[0.02]">
            <Camera className="w-3.5 h-3.5 text-muted-foreground/20" />
            <span className="text-[10px] font-medium text-muted-foreground/25 uppercase tracking-wider">
              No receipt attached
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
