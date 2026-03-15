"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

type GoalSettings = {
  enabled: boolean;
  default_goal_type: string;
  ai_suggestions: boolean;
  reminders_enabled: boolean;
  reminder_frequency: string;
  show_completed: boolean;
  allow_notes: boolean;
  allow_milestones: boolean;
};

export default function GoalSettingsPage() {
  const router = useRouter();
  const { workspaceId } = useAuth();
  const [settings, setSettings] = useState<GoalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    api<GoalSettings>(`/api/workspaces/${workspaceId}/goals/settings`)
      .then((r) => setSettings(r.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    if (!workspaceId || !settings) return;
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/goals/settings`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof GoalSettings) {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background text-foreground px-5 pt-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans tracking-tight px-5">
      <header className="z-30 -mx-5 px-5 py-3 bg-background/80 backdrop-blur-md flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold">Goal Settings</h1>
      </header>

      <div className="mt-4 space-y-6">
        {/* General */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1">General</p>
          <div className="bg-card/30 rounded-xl overflow-hidden divide-y divide-border/20">
            <ToggleRow label="Goals Enabled" value={settings.enabled} onToggle={() => toggle("enabled")} />
            <ToggleRow label="Show Completed Goals" value={settings.show_completed} onToggle={() => toggle("show_completed")} />
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold">Default Goal Type</span>
              <select
                value={settings.default_goal_type}
                onChange={(e) => setSettings({ ...settings, default_goal_type: e.target.value })}
                className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
              >
                <option value="financial">Financial</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Features</p>
          <div className="bg-card/30 rounded-xl overflow-hidden divide-y divide-border/20">
            <ToggleRow label="Allow Milestones" value={settings.allow_milestones} onToggle={() => toggle("allow_milestones")} />
            <ToggleRow label="Allow Notes" value={settings.allow_notes} onToggle={() => toggle("allow_notes")} />
            <ToggleRow label="AI Suggestions" value={settings.ai_suggestions} onToggle={() => toggle("ai_suggestions")} />
          </div>
        </section>

        {/* Reminders */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Reminders</p>
          <div className="bg-card/30 rounded-xl overflow-hidden divide-y divide-border/20">
            <ToggleRow label="Reminders Enabled" value={settings.reminders_enabled} onToggle={() => toggle("reminders_enabled")} />
            {settings.reminders_enabled && (
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold">Frequency</span>
                <select
                  value={settings.reminder_frequency}
                  onChange={(e) => setSettings({ ...settings, reminder_frequency: e.target.value })}
                  className="bg-card rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-8 pb-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </footer>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-bold">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          value ? "bg-emerald-500" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
