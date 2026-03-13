"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { loadDashboardMode, saveDashboardMode, type DashboardMode } from "@/lib/dashboard-preferences";
import { Calendar, LineChart } from "lucide-react";

export default function DashboardSettingsPage() {
  const { workspaceId } = useAuth();
  const [mode, setMode] = useState<DashboardMode>("monthly_focus");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const initial = loadDashboardMode(workspaceId);
    setMode(initial);
  }, [workspaceId]);

  function handleChange(next: DashboardMode) {
    if (!workspaceId) return;
    setMode(next);
    setSaving(true);
    saveDashboardMode(workspaceId, next);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 font-sans tracking-tight">
      <main className="px-6 pt-6 space-y-8">
        <section className="space-y-2">
          <h1 className="text-lg font-bold">Dashboard Mode</h1>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose how your finance dashboard behaves. You can switch between a simple
            month-focused view and a more detailed timeline at any time.
          </p>
          {saved && (
            <p className="text-[11px] text-chart-1 font-medium mt-1">
              Preference saved for this workspace.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
            Modes
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleChange("monthly_focus")}
              className={`w-full text-left p-5 rounded-xl border transition-all active:scale-[0.98] ${
                mode === "monthly_focus"
                  ? "bg-card border-primary/60 shadow-lg shadow-primary/10"
                  : "bg-card/40 border-border/60 hover:bg-card"
              }`}
              disabled={saving}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-sm font-bold">Monthly Focus</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Simpler dashboard optimised for month-based planning.
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                <li>• Default period is <strong>This Month</strong>.</li>
                <li>• Keeps things focused on a single month.</li>
                <li>• Emphasises monthly cashflow and fixed bills.</li>
              </ul>
            </button>

            <button
              type="button"
              onClick={() => handleChange("full_timeline")}
              className={`w-full text-left p-5 rounded-xl border transition-all active:scale-[0.98] ${
                mode === "full_timeline"
                  ? "bg-card border-primary/60 shadow-lg shadow-primary/10"
                  : "bg-card/40 border-border/60 hover:bg-card"
              }`}
              disabled={saving}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                  <LineChart className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm font-bold">Full Timeline</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Richer timeline with short-term and monthly views.
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                <li>• Shows <strong>Lifetime</strong>, <strong>3 Months</strong>, <strong>6 Months</strong>, and more timeline filters.</li>
                <li>• Better for detailed transaction and cashflow analysis over longer periods.</li>
                <li>• Keeps all timeline-based dashboard options visible.</li>
              </ul>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

