import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchOne, insertOne, execute } from "@/lib/sql";

type GoalSettings = {
  id: number;
  workspace_id: number;
  enabled: boolean;
  default_goal_type: string;
  ai_suggestions: boolean;
  reminders_enabled: boolean;
  reminder_frequency: string;
  show_completed: boolean;
  allow_notes: boolean;
  allow_milestones: boolean;
};

const DEFAULTS: Omit<GoalSettings, "id" | "workspace_id"> = {
  enabled: true,
  default_goal_type: "financial",
  ai_suggestions: true,
  reminders_enabled: false,
  reminder_frequency: "weekly",
  show_completed: true,
  allow_notes: true,
  allow_milestones: true,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const { workspaceId } = await requireWorkspaceMember(req, wid);

    const settings = await fetchOne<GoalSettings>(
      "SELECT * FROM goal_settings WHERE workspace_id = ? LIMIT 1",
      [workspaceId],
    );

    return NextResponse.json({ data: settings || { workspace_id: workspaceId, ...DEFAULTS } });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("GET goal settings error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const { workspaceId } = await requireWorkspaceAdmin(req, wid);
    const body = await req.json();

    const existing = await fetchOne<{ id: number }>(
      "SELECT id FROM goal_settings WHERE workspace_id = ? LIMIT 1",
      [workspaceId],
    );

    const enabled = body.enabled ?? DEFAULTS.enabled;
    const default_goal_type = body.default_goal_type ?? DEFAULTS.default_goal_type;
    const ai_suggestions = body.ai_suggestions ?? DEFAULTS.ai_suggestions;
    const reminders_enabled = body.reminders_enabled ?? DEFAULTS.reminders_enabled;
    const reminder_frequency = body.reminder_frequency ?? DEFAULTS.reminder_frequency;
    const show_completed = body.show_completed ?? DEFAULTS.show_completed;
    const allow_notes = body.allow_notes ?? DEFAULTS.allow_notes;
    const allow_milestones = body.allow_milestones ?? DEFAULTS.allow_milestones;

    if (existing) {
      await execute(
        `UPDATE goal_settings SET enabled = ?, default_goal_type = ?, ai_suggestions = ?, reminders_enabled = ?, reminder_frequency = ?, show_completed = ?, allow_notes = ?, allow_milestones = ?, updated_at = NOW(3) WHERE workspace_id = ?`,
        [enabled, default_goal_type, ai_suggestions, reminders_enabled, reminder_frequency, show_completed, allow_notes, allow_milestones, workspaceId],
      );
    } else {
      await insertOne(
        `INSERT INTO goal_settings (workspace_id, enabled, default_goal_type, ai_suggestions, reminders_enabled, reminder_frequency, show_completed, allow_notes, allow_milestones, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [workspaceId, enabled, default_goal_type, ai_suggestions, reminders_enabled, reminder_frequency, show_completed, allow_notes, allow_milestones],
      );
    }

    return NextResponse.json({ message: "Saved." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    console.error("PUT goal settings error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
