"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL, formatBRL, formatMoney, formatDate } from "@/lib/format";
import { ArrowLeft, Plus, Check, Trash2, MessageSquare, X, Pencil, MoreVertical } from "lucide-react";

type Milestone = {
  id: number;
  title: string;
  target_amount: number | null;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
};

type Note = {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
};

type Contribution = {
  id: number;
  user_name: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
};

type GoalDetail = {
  id: number;
  type: "financial" | "general";
  name: string;
  icon: string | null;
  color: string | null;
  target_amount: number | null;
  current_amount: number;
  currency: string;
  deadline: string | null;
  contribution_frequency: string | null;
  contribution_amount: number | null;
  status: string;
  progress: number;
  created_at: string;
  milestones: Milestone[];
  notes: Note[];
  contributions: Contribution[];
};

function EditGoalModal({
  isOpen,
  onClose,
  onSave,
  saving,
  goal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  goal: GoalDetail;
}) {
  const [name, setName] = useState(goal.name);
  const [icon, setIcon] = useState(goal.icon || "");
  const [targetAmount, setTargetAmount] = useState(goal.target_amount?.toString() || "");
  const [deadline, setDeadline] = useState(goal.deadline ? goal.deadline.slice(0, 10) : "");
  const [contributionFrequency, setContributionFrequency] = useState(goal.contribution_frequency || "");
  const [contributionAmount, setContributionAmount] = useState(goal.contribution_amount?.toString() || "");

  useEffect(() => {
    if (isOpen) {
      setName(goal.name);
      setIcon(goal.icon || "");
      setTargetAmount(goal.target_amount?.toString() || "");
      setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : "");
      setContributionFrequency(goal.contribution_frequency || "");
      setContributionAmount(goal.contribution_amount?.toString() || "");
    }
  }, [isOpen, goal]);

  if (!isOpen) return null;

  const isFinancial = goal.type === "financial";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-5 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Edit Goal</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border"
            />
          </div>
          <div>
            <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Icon (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🎯"
              className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border"
            />
          </div>
          {isFinancial && (
            <>
              <div>
                <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Target Amount</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Contribution Frequency</label>
                <select
                  value={contributionFrequency}
                  onChange={(e) => setContributionFrequency(e.target.value)}
                  className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border"
                >
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {contributionFrequency && (
                <div>
                  <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Contribution Amount</label>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
            </>
          )}
          <div>
            <label className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const data: Record<string, any> = { name };
            if (icon) data.icon = icon;
            if (isFinancial && targetAmount) data.target_amount = parseFloat(targetAmount);
            if (deadline) data.deadline = deadline;
            if (isFinancial) {
              data.contribution_frequency = contributionFrequency || null;
              data.contribution_amount = contributionAmount ? parseFloat(contributionAmount) : null;
            }
            onSave(data);
          }}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleting,
  goalName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  goalName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-5 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Delete Goal</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-bold text-foreground">{goalName}</span>? This will also remove all milestones, notes, and contributions. This action cannot be undone.
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

function ContributionModal({
  isOpen,
  onClose,
  onSave,
  saving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, note: string, date: string) => void;
  saving: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-6 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Add Contribution</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-col items-center py-2">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-muted-foreground/30">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              className="w-full max-w-[200px] text-4xl font-heading font-black bg-transparent border-none outline-none text-center placeholder:text-muted/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tight"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border placeholder:text-muted-foreground/40"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const val = parseFloat(amount);
            if (val > 0) onSave(val, note.trim(), date);
          }}
          disabled={saving || !amount || parseFloat(amount) <= 0}
          className="w-full py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;
  const { workspaceId } = useAuth();

  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [savingContribution, setSavingContribution] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "notes">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchGoal = useCallback(() => {
    if (!workspaceId || !goalId) return;
    setLoading(true);
    api<GoalDetail>(`/api/workspaces/${workspaceId}/goals/${goalId}`)
      .then((r) => setGoal(r.data ?? null))
      .catch(() => setGoal(null))
      .finally(() => setLoading(false));
  }, [workspaceId, goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  async function handleEditGoal(data: Record<string, any>) {
    if (!workspaceId) return;
    setSavingEdit(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setEditOpen(false);
      fetchGoal();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteGoal() {
    if (!workspaceId) return;
    setDeleting(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}`, { method: "DELETE" });
      router.push("/goals");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  async function handleAddContribution(amount: number, note: string, date: string) {
    if (!workspaceId) return;
    setSavingContribution(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/contributions`, {
        method: "POST",
        body: JSON.stringify({ amount, note: note || null, date }),
      });
      setContributionOpen(false);
      fetchGoal();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContribution(false);
    }
  }

  async function handleAddNote() {
    if (!workspaceId || !newNote.trim()) return;
    setSavingNote(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNote.trim() }),
      });
      setNewNote("");
      fetchGoal();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/notes/${noteId}`, { method: "DELETE" });
      fetchGoal();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddMilestone() {
    if (!workspaceId || !newMilestone.trim()) return;
    setSavingMilestone(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/milestones`, {
        method: "POST",
        body: JSON.stringify({ title: newMilestone.trim() }),
      });
      setNewMilestone("");
      fetchGoal();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMilestone(false);
    }
  }

  async function handleToggleMilestone(milestoneId: number, completed: boolean) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: !completed }),
      });
      fetchGoal();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteMilestone(milestoneId: number) {
    if (!workspaceId) return;
    try {
      await api(`/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`, { method: "DELETE" });
      fetchGoal();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground px-5 pt-4">
        <div className="space-y-4">
          <div className="h-10 bg-card rounded-xl animate-pulse" />
          <div className="h-40 bg-card rounded-xl animate-pulse" />
          <div className="h-24 bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-background text-foreground px-5 pt-4 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Goal not found.</p>
        <button onClick={() => router.push("/goals")} className="text-sm text-primary font-bold">Back to Goals</button>
      </div>
    );
  }

  const isFinancial = goal.type === "financial";
  const pct = isFinancial && goal.target_amount
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0;
  const milestonePct = goal.milestones.length > 0
    ? (goal.milestones.filter((m) => m.is_completed).length / goal.milestones.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight px-5">
      {/* Header */}
      <header className="z-30 -mx-5 px-5 py-3 bg-background/80 backdrop-blur-md flex items-center gap-4">
        <button
          onClick={() => router.push("/goals")}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{goal.name}</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">
            {isFinancial ? "Financial Goal" : "Life Goal"}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
                <button
                  onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                  className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Edit Goal
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                  className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Goal
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Progress Card */}
      <div className="bg-card rounded-2xl p-5 mt-4 space-y-4">
        {isFinancial ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-3xl font-black tracking-tight">
                {formatMoney(goal.current_amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              {goal.target_amount && (
                <p className="text-xs text-muted-foreground">
                  of {formatMoney(goal.target_amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} target
                </p>
              )}
            </div>
            {goal.target_amount && (
              <>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-blue-400" : pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-orange-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="text-center text-[11px] sm:text-xs text-muted-foreground/60 font-bold">{pct.toFixed(1)}% complete</p>
              </>
            )}
            {goal.deadline && (
              <p className="text-center text-[11px] sm:text-xs text-muted-foreground/40 font-bold uppercase">
                Target: {formatDate(goal.deadline)}
              </p>
            )}
            {goal.contribution_frequency && goal.contribution_amount && (
              <p className="text-center text-[11px] sm:text-xs text-muted-foreground/40">
                {formatMoney(goal.contribution_amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {goal.contribution_frequency}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="text-3xl font-black tracking-tight">
                {goal.milestones.filter((m) => m.is_completed).length}
                <span className="text-lg text-muted-foreground font-normal"> / {goal.milestones.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">milestones completed</p>
            </div>
            {goal.milestones.length > 0 && (
              <>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-400 transition-all"
                    style={{ width: `${Math.min(100, milestonePct)}%` }}
                  />
                </div>
                <p className="text-center text-[11px] sm:text-xs text-muted-foreground/60 font-bold">{milestonePct.toFixed(0)}% complete</p>
              </>
            )}
            {goal.deadline && (
              <p className="text-center text-[11px] sm:text-xs text-muted-foreground/40 font-bold uppercase">
                Target: {formatDate(goal.deadline)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {isFinancial && (
          <button
            onClick={() => setContributionOpen(true)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Money
          </button>
        )}
        {goal.status !== "completed" && (
          <button
            onClick={async () => {
              if (!workspaceId) return;
              await api(`/api/workspaces/${workspaceId}/goals/${goalId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "completed" }),
              });
              fetchGoal();
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-3.5 h-3.5" /> Complete
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-6 mb-4">
        {(["overview", "milestones", "notes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
              activeTab === t
                ? "bg-white text-black border-white"
                : "bg-transparent text-muted-foreground border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Recent Contributions (financial) */}
          {isFinancial && goal.contributions.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest px-1">
                Recent Contributions
              </p>
              <div className="space-y-2">
                {goal.contributions.slice(0, 5).map((c) => (
                  <div key={c.id} className="bg-card rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">
                        + {formatMoney(c.amount)}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground/50">
                        {c.user_name} · {formatDate(c.date)}
                      </p>
                      {c.note && <p className="text-[11px] sm:text-xs text-muted-foreground/40 mt-0.5">{c.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Milestones Preview */}
          {goal.milestones.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest px-1">
                Milestones
              </p>
              <div className="space-y-2">
                {goal.milestones.slice(0, 4).map((m) => (
                  <div key={m.id} className="bg-card rounded-xl px-4 py-3 flex items-center gap-3">
                    <button
                      onClick={() => handleToggleMilestone(m.id, m.is_completed)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        m.is_completed ? "bg-emerald-400 border-emerald-400" : "border-white/20"
                      }`}
                    >
                      {m.is_completed && <Check className="w-3 h-3 text-black" />}
                    </button>
                    <span className={`text-sm flex-1 ${m.is_completed ? "line-through text-muted-foreground/40" : ""}`}>
                      {m.title}
                    </span>
                  </div>
                ))}
                {goal.milestones.length > 4 && (
                  <button
                    onClick={() => setActiveTab("milestones")}
                    className="text-[11px] sm:text-xs text-primary font-bold uppercase tracking-wider px-1"
                  >
                    View all {goal.milestones.length} milestones →
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Recent Notes Preview */}
          {goal.notes.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest px-1">
                Recent Notes
              </p>
              <div className="space-y-2">
                {goal.notes.slice(0, 2).map((n) => (
                  <div key={n.id} className="bg-card rounded-xl px-4 py-3">
                    <p className="text-sm">{n.content}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground/40 mt-1">
                      {n.user_name} · {formatDate(n.created_at)}
                    </p>
                  </div>
                ))}
                {goal.notes.length > 2 && (
                  <button
                    onClick={() => setActiveTab("notes")}
                    className="text-[11px] sm:text-xs text-primary font-bold uppercase tracking-wider px-1"
                  >
                    View all {goal.notes.length} notes →
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-3">
          {goal.milestones.map((m) => (
            <div key={m.id} className="bg-card rounded-xl px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => handleToggleMilestone(m.id, m.is_completed)}
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  m.is_completed ? "bg-emerald-400 border-emerald-400" : "border-white/20"
                }`}
              >
                {m.is_completed && <Check className="w-3 h-3 text-black" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${m.is_completed ? "line-through text-muted-foreground/40" : ""}`}>
                  {m.title}
                </span>
                {m.target_date && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground/40">
                    {formatDate(m.target_date)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteMilestone(m.id)}
                className="text-muted-foreground/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              className="flex-1 bg-card rounded-xl px-4 py-3 text-sm border border-border placeholder:text-muted-foreground/40"
              placeholder="Add milestone..."
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMilestone())}
            />
            <button
              type="button"
              onClick={handleAddMilestone}
              disabled={savingMilestone || !newMilestone.trim()}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-3">
          {/* Add Note */}
          <div className="flex items-start gap-2">
            <textarea
              className="flex-1 bg-card rounded-xl px-4 py-3 text-sm border border-border placeholder:text-muted-foreground/40 min-h-[60px] resize-none"
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={savingNote || !newNote.trim()}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 shrink-0"
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {goal.notes.map((n) => (
            <div key={n.id} className="bg-card rounded-xl px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm">{n.content}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground/40 mt-1">
                    {n.user_name} · {formatDate(n.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(n.id)}
                  className="text-muted-foreground/30 hover:text-red-400 transition-colors ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {goal.notes.length === 0 && (
            <p className="text-center text-sm text-muted-foreground/40 py-8">No notes yet.</p>
          )}
        </div>
      )}

      <ContributionModal
        isOpen={contributionOpen}
        onClose={() => setContributionOpen(false)}
        onSave={handleAddContribution}
        saving={savingContribution}
      />

      <EditGoalModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditGoal}
        saving={savingEdit}
        goal={goal}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteGoal}
        deleting={deleting}
        goalName={goal.name}
      />
    </div>
  );
}
