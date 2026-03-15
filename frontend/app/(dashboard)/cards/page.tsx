"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL, formatBRL } from "@/lib/format";
import { Plus } from "lucide-react";
import { CardModal, type CreditCard } from "./CardModal";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function CardsPage() {
  const { workspaceId } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCards = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    api<CreditCard[]>(`/api/workspaces/${workspaceId}/credit-cards`)
      .then((r) => setCards(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleSave(data: { name: string; owner: string; credit_limit: number; payment_due_day: number }) {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const isEdit = !!editingCard;
      const url = isEdit
        ? `/api/workspaces/${workspaceId}/credit-cards/${editingCard.id}`
        : `/api/workspaces/${workspaceId}/credit-cards`;
      await api(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(data),
      });
      fetchCards();
      setModalOpen(false);
      setEditingCard(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!workspaceId) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm("Delete this card? This cannot be undone.");
      if (!ok) return;
    }
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/credit-cards/${id}`, { method: "DELETE" });
      fetchCards();
      setModalOpen(false);
      setEditingCard(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-32 font-sans tracking-tight px-5">
      <header className="z-30 -mx-5 px-5 py-3 sm:py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <h1 className="page-title">My Cards</h1>
        <button
          onClick={() => { setEditingCard(null); setModalOpen(true); }}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
          aria-label="Add Card"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      <main className="py-4 space-y-4">
        {loading ? (
          <div className="space-y-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="h-3 w-20" />
                  </div>
                  <SkeletonBox className="h-6 w-24" />
                </div>
                <SkeletonBox className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-card/50 p-8 rounded-xl text-center space-y-4">
            <p className="text-muted-foreground text-sm">No cards added yet.</p>
            <button
              onClick={() => { setEditingCard(null); setModalOpen(true); }}
              className="py-2.5 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Add Card
            </button>
          </div>
        ) : (
          cards.map((card) => {
            const usedPct = card.credit_limit > 0 ? Math.min(100, (card.current_balance / card.credit_limit) * 100) : 0;
            return (
              <div
                key={card.id}
                onClick={() => { setEditingCard(card); setModalOpen(true); }}
                className="bg-card p-5 rounded-xl space-y-4 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{card.name}</p>
                    {card.owner && (
                      <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest opacity-60 mt-0.5">{card.owner}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-tighter">
                      {CURRENCY_SYMBOL} {formatBRL(card.credit_limit, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter opacity-60">
                      {(() => {
                        const dueDay = card.payment_due_day;
                        const now = new Date();
                        const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);
                        const target = thisMonth > now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
                        const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return days <= 5
                          ? <span className="text-yellow-400">Due in {days}d</span>
                          : <>Due in {days}d</>;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: usedPct > 0 ? `${Math.max(usedPct, 2)}%` : "0%" }}
                      className={`h-full rounded-full transition-all duration-500 ${usedPct >= 90 ? "bg-chart-2" : usedPct >= 70 ? "bg-yellow-400" : "bg-white"}`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter opacity-50">
                      {CURRENCY_SYMBOL} {formatBRL(card.current_balance, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} used
                    </p>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter opacity-50">
                      {usedPct.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {modalOpen && (
        <CardModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingCard(null); }}
          onSave={handleSave}
          onDelete={editingCard ? handleDelete : undefined}
          initialData={editingCard}
          saving={saving}
        />
      )}
    </div>
  );
}
