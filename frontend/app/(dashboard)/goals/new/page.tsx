"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { Plus, X } from "lucide-react";

type GoalType = "financial" | "general";

const ICON_OPTIONS = ["🎯", "💰", "🏠", "🚗", "✈️", "📚", "💪", "🎓", "💍", "🏦", "📈", "🏁"];

export default function NewGoalPage() {
  const router = useRouter();
  const { workspaceId } = useAuth();

  const [goalType, setGoalType] = useState<GoalType>("financial");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState("monthly");
  const [contributionAmount, setContributionAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [milestones, setMilestones] = useState<{ title: string; target_date?: string }[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addMilestone() {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { title: newMilestone.trim() }]);
    setNewMilestone("");
  }

  function removeMilestone(idx: number) {
    setMilestones(milestones.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!workspaceId || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body: any = {
        type: goalType,
        name: name.trim(),
        icon,
        deadline: deadline || null,
        notes: notes.trim() || null,
      };

      if (goalType === "financial") {
        body.target_amount = parseFloat(targetAmount) || null;
        body.contribution_frequency = contributionFrequency;
        body.contribution_amount = parseFloat(contributionAmount) || null;
      }

      if (goalType === "general" && milestones.length > 0) {
        body.milestones = milestones;
      }

      const res = await api<{ id: number }>(`/api/workspaces/${workspaceId}/goals`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      router.push(`/goals/${res.data!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight flex flex-col">
      <header className="z-40 bg-background/80 backdrop-blur-md px-5 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] sm:text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
        >
          Cancel
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-foreground/80">
          New Goal
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="text-[11px] sm:text-xs font-bold text-primary hover:opacity-80 disabled:opacity-40 transition-opacity uppercase tracking-wider"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <main className="flex-1 px-5 pt-2 space-y-8">
        {/* Type Toggle */}
        <div className="flex gap-2">
          {(["financial", "general"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setGoalType(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                goalType === t
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-muted-foreground border-white/10"
              }`}
            >
              {t === "financial" ? "💰 Financial" : "🏁 Life Goal"}
            </button>
          ))}
        </div>

        {/* Icon + Name */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-xl bg-card flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-black/20">
              <span className="text-3xl leading-none">{icon}</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Emoji</span>
            </div>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick icon"
            >
              {ICON_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">
              Goal Name
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-xl font-bold text-foreground placeholder:text-muted/10 p-0"
              placeholder={goalType === "financial" ? "Emergency Fund" : "Learn Spanish"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Custom Icon */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">
            Or custom
          </span>
          <input
            type="text"
            maxLength={2}
            value={icon}
            onChange={(e) => setIcon(e.target.value || "🎯")}
            placeholder="🙂"
            className="flex-1 bg-card rounded-lg border border-border px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Financial Fields */}
        {goalType === "financial" && (
          <>
            <div className="flex flex-col items-center py-4">
              <label className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
                Target Amount
              </label>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-light text-muted-foreground/30 tracking-tight">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  type="number"
                  className="w-full max-w-[240px] text-4xl font-heading font-black bg-transparent border-none outline-none text-center placeholder:text-muted/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tight"
                  placeholder="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1 bg-card/30 rounded-xl overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <span className="text-muted-foreground text-lg">📅</span>
                  </div>
                  <span className="text-sm font-bold">Contribution</span>
                </div>
                <select
                  value={contributionFrequency}
                  onChange={(e) => setContributionFrequency(e.target.value)}
                  className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="h-px bg-border/20 mx-4" />
              <div className="w-full px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <span className="text-muted-foreground text-lg">💵</span>
                  </div>
                  <span className="text-sm font-bold">Amount per Period</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    className="w-20 bg-card rounded-lg border border-border px-3 py-1.5 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* General Goal - Milestones */}
        {goalType === "general" && (
          <div className="space-y-3">
            <p className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
              Milestones
            </p>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card rounded-xl px-4 py-3"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0" />
                  <span className="flex-1 text-sm">{m.title}</span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 bg-card rounded-xl px-4 py-3 text-sm border border-border placeholder:text-muted-foreground/40"
                  placeholder="Add a milestone..."
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deadline */}
        <div className="space-y-1 bg-card/30 rounded-xl overflow-hidden">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <span className="text-muted-foreground text-lg">🎯</span>
              </div>
              <span className="text-sm font-bold">Target Date</span>
            </div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <p className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
            Notes
          </p>
          <textarea
            className="w-full bg-card rounded-xl px-4 py-3 text-sm border border-border placeholder:text-muted-foreground/40 min-h-[80px] resize-none"
            placeholder="Strategy, motivation, or anything you want to remember..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="px-2 text-sm text-chart-2">{error}</p>
        )}
      </main>

      <footer className="p-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Create Goal"}
        </button>
      </footer>
    </div>
  );
}
