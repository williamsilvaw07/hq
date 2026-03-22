"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Image as ImageIcon,
  Check,
  DollarSign,
  X,
  ExternalLink,
  Trash2,
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

  // New payment form state
  const today = new Date();
  const [periodMonth, setPeriodMonth] = useState(today.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(today.getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      const url = URL.createObjectURL(picked);
      setPreview(url);
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

  return (
    <Modal
      isOpen
      onClose={onClose}
      subtitle="PAYMENT PROOF"
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
        {/* Amount (read-only) */}
        <div className="text-center py-2">
          <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">
            Amount
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            {formatMoney(bill.amount)}
          </h2>
        </div>

        {/* Status badge */}
        <div className="text-center">
          {currentMonthPaid ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Paid this month
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Not paid yet
              </span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-black/30 p-1 rounded-full gap-1">
          {[
            { value: "new" as const, label: "New Payment" },
            { value: "history" as const, label: `History (${payments.length})` },
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
            <div className="flex items-center gap-3 border border-white/[0.08] rounded-2xl px-4 py-4">
              <DollarSign className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">
                  Billing Period
                </p>
                <div className="flex gap-3">
                  <select
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent outline-none text-sm font-semibold text-foreground flex-1"
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
                    className="w-20 bg-transparent outline-none text-sm font-semibold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Receipt upload */}
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-4 py-4">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">
                  Payment Receipt
                </p>

                {file ? (
                  <div className="space-y-3">
                    {preview ? (
                      <div className="relative rounded-xl overflow-hidden bg-black/20">
                        <img
                          src={preview}
                          alt="Payment proof preview"
                          className="w-full max-h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]">
                        <FileText className="w-5 h-5 text-muted-foreground/50" />
                        <span className="text-sm font-medium text-foreground truncate flex-1">
                          {file.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={clearFile}
                      className="flex items-center gap-1.5 text-xs font-bold text-chart-2 uppercase tracking-wider active:opacity-70"
                    >
                      <X className="w-3 h-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-white/[0.2] transition-colors flex flex-col items-center gap-2"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground/40" />
                    <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                      Tap to upload receipt
                    </span>
                    <span className="text-[10px] text-muted-foreground/30">
                      Images or PDF, max 5MB
                    </span>
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
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground/50">No payments recorded yet.</p>
                <button
                  type="button"
                  onClick={() => setTab("new")}
                  className="mt-3 text-xs font-bold text-white uppercase tracking-wider active:opacity-70"
                >
                  Record first payment
                </button>
              </div>
            ) : (
              payments.map((payment) => (
                <PaymentHistoryCard
                  key={payment.id}
                  payment={payment}
                  onDelete={() => handleDelete(payment.id)}
                />
              ))
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
  const [showProof, setShowProof] = useState(false);
  const isPdf = payment.proofUrl?.endsWith(".pdf");

  return (
    <div className="bg-white/[0.04] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {formatMoney(payment.amount)}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {formatPeriod(payment.periodMonth, payment.periodYear)} · Paid {payment.paidAt}
            {payment.paidByName ? ` by ${payment.paidByName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {payment.proofUrl && (
            <button
              type="button"
              onClick={() => setShowProof(!showProof)}
              className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-90 transition-all"
              title="View proof"
            >
              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-90 transition-all"
            title="Delete payment"
          >
            <Trash2 className="w-3.5 h-3.5 text-chart-2/60" />
          </button>
        </div>
      </div>

      {showProof && payment.proofUrl && (
        <div className="border-t border-white/[0.06] p-4">
          {isPdf ? (
            <a
              href={buildMediaUrl(payment.proofUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              <FileText className="w-4 h-4" />
              {payment.proofFilename ?? "View PDF"}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <a
              href={buildMediaUrl(payment.proofUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={buildMediaUrl(payment.proofUrl)}
                alt="Payment proof"
                className="w-full rounded-xl max-h-64 object-contain bg-black/20"
              />
            </a>
          )}
        </div>
      )}

      {payment.source !== "web" && (
        <div className="px-4 pb-3">
          <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-wider">
            via {payment.source}
          </span>
        </div>
      )}
    </div>
  );
}
