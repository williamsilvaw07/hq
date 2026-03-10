"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Transaction = {
  id: number;
  account_id: number | null;
  category_id: number;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  status: string;
  account?: { id: number; name: string } | null;
  category?: { id: number; name: string };
};

type Account = { id: number; name: string };
type Category = { id: number; name: string; type: string };

export default function EditTransactionClient() {
  const { workspaceId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? Number(rawId) : NaN;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    if (!workspaceId || !Number.isFinite(id)) return;
    api<Transaction>(`/api/workspaces/${workspaceId}/transactions/${id}`)
      .then((r) => {
        const t = r.data;
        if (!t) return;
        setTransaction(t);
        setAccountId(t.account_id ? String(t.account_id) : "");
        setCategoryId(String(t.category_id));
        setAmount(String(t.amount));
        setDate(t.date);
        setDescription(t.description || "");
        setStatus(t.status);
      })
      .catch(() => router.push("/transactions"));
  }, [workspaceId, id, router]);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      api<{ accounts: Account[]; credit_cards: unknown[] }>(`/api/workspaces/${workspaceId}/accounts`),
      api<Category[]>(`/api/workspaces/${workspaceId}/categories`),
    ]).then(([accRes, catRes]) => {
      if (accRes.data?.accounts) setAccounts(accRes.data.accounts);
      if (Array.isArray(catRes.data)) setCategories(catRes.data);
    }).catch(() => {});
  }, [workspaceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !transaction || !Number.isFinite(id)) return;
    if (status === "confirmed" && !accountId) {
      setError("Account is required when confirming.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          account_id: accountId ? Number(accountId) : null,
          category_id: Number(categoryId),
          amount: parseFloat(amount),
          date,
          description: description || null,
          status,
        }),
      });
      router.push(transaction.status === "draft" ? "/pending" : "/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newCategoryName.trim() || !transaction) return;
    setCategoryError("");
    setSavingCategory(true);
    try {
      const res = await api<Category>(`/api/workspaces/${workspaceId}/categories`, {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName.trim(), type: transaction.type }),
      });
      if (res.data) {
        setCategories((prev) => [...prev, res.data as Category]);
        setCategoryId(String(res.data.id));
        setNewCategoryName("");
        setShowNewCategory(false);
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  }

  if (!transaction) return <div className="text-muted-foreground">Loading…</div>;

  const relevantCategories = categories.filter(
    (c) => c.type === transaction.type
  );

  return (
    <div className="max-w-md space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link href={transaction.status === "draft" ? "/pending" : "/transactions"} className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground">
          ← Back
        </Link>
      </div>
      <h1 className="text-xl font-bold text-foreground">
        {transaction.status === "draft" ? "Confirm / Edit transaction" : "Edit transaction"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-2xl p-3">
            {error}
          </p>
        )}
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
          >
            {relevantCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {!showNewCategory ? (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              + Add custom category
            </button>
          ) : (
            <div className="mt-3 p-3 rounded-xl bg-secondary/50 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New category</p>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 bg-card rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  autoFocus
                />
                <button type="submit" disabled={savingCategory || !newCategoryName.trim()} className="py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
                  {savingCategory ? "…" : "Add"}
                </button>
                <button type="button" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); setCategoryError(""); }} className="py-2 px-2 rounded-xl border border-border text-muted-foreground text-xs font-bold">
                  Cancel
                </button>
              </form>
              {categoryError && <p className="text-xs text-chart-2">{categoryError}</p>}
            </div>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        {transaction.status === "draft" && (
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-foreground outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="draft">Draft</option>
              <option value="confirmed">Confirm</option>
              <option value="needs_review">Needs review</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary py-3.5 font-bold text-sm text-primary-foreground shadow-lg shadow-white/5 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
