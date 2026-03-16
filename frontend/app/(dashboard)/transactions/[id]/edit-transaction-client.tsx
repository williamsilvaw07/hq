"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL, formatBRL, formatDate } from "@/lib/format";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { TransactionModal } from "../TransactionModal";

type Transaction = {
  id: number;
  account_id: number | null;
  category_id: number;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  status: string;
  source?: string;
  account?: { id: number; name: string } | null;
  category?: { id: number; name: string };
  created_at?: string;
};

type Account = { id: number; name: string };
type Category = { id: number; name: string; type: string };

function DeleteConfirm({
  isOpen,
  onClose,
  onConfirm,
  deleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-5 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-400">Delete Transaction</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold uppercase tracking-widest active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditTransactionClient() {
  const { workspaceId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? Number(rawId) : NaN;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTransaction = useCallback(() => {
    if (!workspaceId || !Number.isFinite(id)) return;
    api<Transaction>(`/api/workspaces/${workspaceId}/transactions/${id}`)
      .then((r) => {
        if (!r.data) throw new Error("Transaction not found");
        setTransaction(r.data);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load transaction."));
  }, [workspaceId, id]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  useEffect(() => {
    if (!workspaceId || !editOpen) return;
    Promise.all([
      api<{ accounts: Account[] }>(`/api/workspaces/${workspaceId}/accounts`),
      api<any[]>(`/api/workspaces/${workspaceId}/budgets?with_summaries=true`),
    ]).then(([accRes, budgetRes]) => {
      setAccounts(accRes.data?.accounts ?? []);
      const budgets = Array.isArray(budgetRes.data) ? budgetRes.data : [];
      setCategories(budgets.map((b: any) => ({
        id: b.category?.id ?? b.categoryId,
        name: b.name || b.category?.name || "Budget",
        type: "expense",
      })));
    }).catch(() => {});
  }, [workspaceId, editOpen]);

  async function handleSave(data: any) {
    if (!workspaceId || !Number.isFinite(id)) return;
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setEditOpen(false);
      fetchTransaction();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!workspaceId || !Number.isFinite(id)) return;
    setDeleting(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions/${id}`, { method: "DELETE" });
      router.push(transaction?.status === "draft" ? "/pending" : "/transactions");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background text-foreground px-5 pt-4">
        <div className="space-y-4">
          <div className="h-10 bg-card rounded-xl animate-pulse" />
          <div className="h-40 bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const isExpense = transaction.type === "expense";
  const timeStr = transaction.created_at
    ? new Date(transaction.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight px-5">
      {/* Header */}
      <header className="z-30 -mx-5 px-5 py-3 bg-background/80 backdrop-blur-md flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold flex-1">Transaction Details</h1>
        <button
          onClick={() => setEditOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-red-400 active:scale-95 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Amount Card */}
      <div className="bg-card rounded-2xl p-6 mt-4 text-center space-y-2">
        <p className={`text-4xl font-black tracking-tighter ${isExpense ? "text-chart-2" : "text-chart-1"}`}>
          {isExpense ? "-" : "+"}{CURRENCY_SYMBOL} {formatBRL(transaction.amount, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
          {isExpense ? "Expense" : "Income"}
        </p>
        {transaction.status === "draft" && (
          <span className="inline-block text-[8px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5 uppercase tracking-widest">
            Needs Review
          </span>
        )}
      </div>

      {/* Details */}
      <div className="mt-4 bg-card/30 rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        <DetailRow label="Description" value={transaction.description || "—"} />
        <DetailRow label="Category" value={transaction.category?.name || "—"} />
        <DetailRow label="Account" value={transaction.account?.name || "—"} />
        <DetailRow label="Date" value={formatDate(transaction.date)} />
        {timeStr && <DetailRow label="Time" value={timeStr} />}
        {transaction.source && <DetailRow label="Source" value={transaction.source} />}
      </div>

      {editOpen && (
        <TransactionModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          categories={categories}
          accounts={accounts}
          saving={saving}
          initialData={{
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            category_id: transaction.category_id,
            account_id: transaction.account_id,
            date: transaction.date,
            status: transaction.status,
          }}
        />
      )}

      <DeleteConfirm
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
