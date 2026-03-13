"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
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
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!workspaceId || !Number.isFinite(id)) return;
    Promise.all([
      api<Transaction>(`/api/workspaces/${workspaceId}/transactions/${id}`),
      api<{ accounts: Account[] }>(`/api/workspaces/${workspaceId}/accounts`),
      api<any[]>(`/api/workspaces/${workspaceId}/budgets`),
    ])
      .then(([txRes, accRes, budgetRes]) => {
        if (!txRes.data) throw new Error("Transaction not found");
        setTransaction(txRes.data);
        setAccounts(accRes.data?.accounts ?? []);
        const budgets = Array.isArray(budgetRes.data) ? budgetRes.data : [];
        setCategories(budgets.map((b: any) => ({ id: b.id, name: b.name || b.category?.name || "Budget", type: "expense" })));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load transaction."));
  }, [workspaceId, id]);

  async function handleSave(data: any) {
    if (!workspaceId || !Number.isFinite(id)) return;
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      router.push(transaction?.status === "draft" ? "/pending" : "/transactions");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    router.push(transaction?.status === "draft" ? "/pending" : "/transactions");
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!transaction) return null;

  const initialData = {
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    category_id: transaction.category_id,
    account_id: transaction.account_id,
    date: transaction.date,
  };

  return (
    <TransactionModal
      isOpen={true}
      onClose={handleClose}
      onSave={handleSave}
      categories={categories}
      accounts={accounts}
      saving={saving}
      initialData={initialData}
    />
  );
}
