"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CURRENCY_SYMBOL, formatBRL, formatDate } from "@/lib/format";
import { Plus, Target, Flag } from "lucide-react";

type Goal = {
  id: number;
  type: "financial" | "general";
  name: string;
  icon: string | null;
  color: string | null;
  target_amount: number | null;
  current_amount: number;
  deadline: string | null;
  status: string;
  progress: number;
  milestone_count: number;
  milestones_completed: number;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  paused: "text-yellow-400 bg-yellow-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const STATUS_LABELS: Record<string, string> = {
  "on-track": "ON TRACK",
  "slightly-behind": "SLIGHTLY BEHIND",
  "behind": "BEHIND",
  "ahead": "AHEAD",
  "completed": "COMPLETED",
};

function getFinancialStatus(goal: Goal): { label: string; color: string } {
  if (goal.status === "completed") return { label: "COMPLETED", color: "text-blue-400 bg-blue-400/10" };
  if (!goal.target_amount || !goal.deadline) return { label: "ACTIVE", color: "text-emerald-400 bg-emerald-400/10" };

  const pct = (goal.current_amount / goal.target_amount) * 100;
  const now = new Date();
  const end = new Date(goal.deadline);
  const start = new Date(goal.created_at);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsed = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const expectedPct = Math.min(100, (elapsed / totalDays) * 100);

  if (pct >= 100) return { label: "COMPLETED", color: "text-blue-400 bg-blue-400/10" };
  if (pct >= expectedPct * 0.9) return { label: "ON TRACK", color: "text-emerald-400 bg-emerald-400/10" };
  if (pct >= expectedPct * 0.7) return { label: "SLIGHTLY BEHIND", color: "text-orange-400 bg-orange-400/10" };
  return { label: "BEHIND", color: "text-red-400 bg-red-400/10" };
}

function getGeneralStatus(goal: Goal): { label: string; color: string } {
  if (goal.status === "completed") return { label: "COMPLETED", color: "text-blue-400 bg-blue-400/10" };
  if (goal.milestone_count === 0) return { label: "IN PROGRESS", color: "text-emerald-400 bg-emerald-400/10" };
  const pct = (goal.milestones_completed / goal.milestone_count) * 100;
  if (pct >= 100) return { label: "COMPLETED", color: "text-blue-400 bg-blue-400/10" };
  if (pct >= 50) return { label: "IN PROGRESS", color: "text-emerald-400 bg-emerald-400/10" };
  return { label: "GETTING STARTED", color: "text-yellow-400 bg-yellow-400/10" };
}

export default function GoalsPage() {
  const { workspaceId } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");

  const fetchGoals = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    api<Goal[]>(`/api/workspaces/${workspaceId}/goals?status=${tab === "completed" ? "completed" : "active"}`)
      .then((r) => setGoals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [workspaceId, tab]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const financialGoals = goals.filter((g) => g.type === "financial");
  const generalGoals = goals.filter((g) => g.type === "general");

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-32 font-sans tracking-tight px-5">
      <header className="z-30 -mx-5 px-5 py-3 sm:py-4 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <h1 className="page-title">Goals</h1>
        <Link
          href="/goals/new"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
          aria-label="New Goal"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
              tab === t
                ? "bg-white text-black border-white"
                : "bg-transparent text-muted-foreground border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-card flex items-center justify-center">
            <Target className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground/60">
            {tab === "active" ? "No active goals yet." : "No completed goals."}
          </p>
          {tab === "active" && (
            <Link
              href="/goals/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Goal
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Financial Goals */}
          {financialGoals.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest px-1">Financial Goals</p>
              <div className="space-y-3">
                {financialGoals.map((goal) => {
                  const pct = goal.target_amount ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                  const status = getFinancialStatus(goal);
                  return (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="block bg-card rounded-xl p-5 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.icon || "🎯"}</span>
                          <div>
                            <p className="text-sm font-bold">{goal.name}</p>
                            <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${status.color} inline-block px-1.5 py-0.5 rounded-full mt-0.5`}>
                              FINANCIAL · {status.label}
                            </p>
                          </div>
                        </div>
                        {goal.deadline && (
                          <p className="text-[11px] sm:text-xs text-muted-foreground/50 font-bold uppercase">
                            {formatDate(goal.deadline)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground/60">
                          {CURRENCY_SYMBOL} {formatBRL(goal.current_amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          {goal.target_amount ? ` of ${CURRENCY_SYMBOL} ${formatBRL(goal.target_amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ""}
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground/40 font-bold">{pct.toFixed(0)}%</p>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-blue-400" : pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-orange-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* General Goals */}
          {generalGoals.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest px-1">Life Goals</p>
              <div className="space-y-3">
                {generalGoals.map((goal) => {
                  const status = getGeneralStatus(goal);
                  const milestonePct = goal.milestone_count > 0 ? (goal.milestones_completed / goal.milestone_count) * 100 : goal.progress;
                  return (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="block bg-card rounded-xl p-5 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.icon || "🏁"}</span>
                          <div>
                            <p className="text-sm font-bold">{goal.name}</p>
                            <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${status.color} inline-block px-1.5 py-0.5 rounded-full mt-0.5`}>
                              GENERAL · {status.label}
                            </p>
                          </div>
                        </div>
                        {goal.deadline && (
                          <p className="text-[11px] sm:text-xs text-muted-foreground/50 font-bold uppercase">
                            {formatDate(goal.deadline)}
                          </p>
                        )}
                      </div>
                      {goal.milestone_count > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground/60">
                            {goal.milestones_completed} of {goal.milestone_count} milestones
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground/40 font-bold">{milestonePct.toFixed(0)}%</p>
                        </div>
                      )}
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all"
                          style={{ width: `${Math.min(100, milestonePct)}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
