"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Wallet, CreditCard, Building2, Plus, X } from "lucide-react";

type Account = { id: number; name: string; type: string; currency: string; balance: number };
type CreditCardItem = { id: number; name: string; credit_limit: number; current_balance: number; currency: string };

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
  { value: "e_wallet", label: "E-Wallet" },
];

function loadAccountsAndCards(workspaceId: number) {
  return api<{ accounts: Account[]; credit_cards: CreditCardItem[] }>(
    `/api/workspaces/${workspaceId}/accounts`
  ).then((r) => ({
    accounts: r.data?.accounts ?? [],
    creditCards: r.data?.credit_cards ?? [],
  }));
}

export default function AccountsPage() {
  const { workspaceId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardItem[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("bank");
  const [accBalance, setAccBalance] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardBalance, setCardBalance] = useState("0");
  const [billingStartDay, setBillingStartDay] = useState("1");
  const [paymentDueDay, setPaymentDueDay] = useState("10");

  useEffect(() => {
    if (!workspaceId) return;
    loadAccountsAndCards(workspaceId).then(({ accounts: a, creditCards: c }) => {
      setAccounts(a);
      setCreditCards(c);
    }).catch(() => {});
  }, [workspaceId]);

  const netWorth = accounts.reduce((s, a) => s + Number(a.balance), 0) - creditCards.reduce((s, c) => s + Number(c.current_balance), 0);
  const primary = accounts[0];
  const sym = "R$";

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !accName.trim()) return;
    setError("");
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/accounts`, {
        method: "POST",
        body: JSON.stringify({
          name: accName.trim(),
          type: accType,
          currency: "BRL",
          balance: parseFloat(accBalance.replace(",", ".")) || 0,
        }),
      });
      const { accounts: a } = await loadAccountsAndCards(workspaceId);
      setAccounts(a);
      setShowAddAccount(false);
      setAccName("");
      setAccBalance("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !cardName.trim() || !cardLimit) return;
    setError("");
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/credit-cards`, {
        method: "POST",
        body: JSON.stringify({
          name: cardName.trim(),
          credit_limit: parseFloat(cardLimit.replace(",", ".")) || 0,
          current_balance: parseFloat(cardBalance.replace(",", ".")) || 0,
          billing_cycle_start_day: Math.min(31, Math.max(1, parseInt(billingStartDay, 10) || 1)),
          payment_due_day: Math.min(31, Math.max(1, parseInt(paymentDueDay, 10) || 10)),
          currency: "BRL",
        }),
      });
      const { creditCards: c } = await loadAccountsAndCards(workspaceId);
      setCreditCards(c);
      setShowAddCard(false);
      setCardName("");
      setCardLimit("");
      setCardBalance("0");
      setBillingStartDay("1");
      setPaymentDueDay("10");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add credit card");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10 pb-4">
      <header className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="section-title mt-1">Net worth: {sym} {netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddAccount(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-white/5 active:scale-95 transition-all"
          aria-label="Add account"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {primary && (
        <section>
          <div className="relative w-full aspect-[1.6/1] rounded-[2.5rem] bg-gradient-to-br from-secondary to-background p-8 border border-white/5 shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2">Primary Account</p>
                <p className="text-lg font-bold text-white tracking-tight">{primary.name}</p>
              </div>
              <Building2 className="w-10 h-10 text-white/20" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-1">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-light text-white/40">{sym}</span>
                <p className="text-4xl font-bold text-white tracking-tighter">{Number(primary.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="section-title">Cash & Savings</h2>
          <button
            type="button"
            onClick={() => setShowAddAccount(true)}
            className="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline"
          >
            + Add account
          </button>
        </div>
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="bg-card p-6 rounded-2xl text-center">
              <p className="text-muted-foreground text-sm">No accounts yet.</p>
              <button
                type="button"
                onClick={() => setShowAddAccount(true)}
                className="mt-3 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95"
              >
                Add your first account
              </button>
            </div>
          ) : (
            accounts.map((a) => (
              <div key={a.id} className="bg-card p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{a.currency} · {a.type}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground">{sym} {Number(a.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="section-title">Credit Cards</h2>
          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline"
          >
            + Add card
          </button>
        </div>
        <div className="space-y-3">
          {creditCards.length === 0 ? (
            <div className="bg-card p-6 rounded-2xl text-center">
              <p className="text-muted-foreground text-sm">No credit cards yet.</p>
              <button
                type="button"
                onClick={() => setShowAddCard(true)}
                className="mt-3 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95"
              >
                Add your first card
              </button>
            </div>
          ) : (
            creditCards.map((c) => (
              <div key={c.id} className="bg-card p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Used {sym} {Number(c.current_balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / Limit {sym} {Number(c.credit_limit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add account</h3>
              <button
                type="button"
                onClick={() => { setShowAddAccount(false); setError(""); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="label block mb-2">Name</label>
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Main Bank"
                  required
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="label block mb-2">Type</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-2">Initial balance (optional)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value.replace(/[^0-9,.-]/g, ""))}
                  placeholder="0"
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {error && <p className="text-sm text-chart-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add credit card</h3>
              <button
                type="button"
                onClick={() => { setShowAddCard(false); setError(""); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="label block mb-2">Card name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Amex Gold"
                  required
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="label block mb-2">Credit limit ({sym})</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="0"
                  required
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="label block mb-2">Current balance ({sym}) – optional</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cardBalance}
                  onChange={(e) => setCardBalance(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="0"
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label block mb-2">Billing cycle start (day 1–31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={billingStartDay}
                    onChange={(e) => setBillingStartDay(e.target.value)}
                    className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="label block mb-2">Payment due (day 1–31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-chart-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
