import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin, type WorkspaceMemberRole } from "@/lib/workspace-auth";
import { fetchOne, fetchMany, execute } from "@/lib/sql";

const ROLE_ORDER: WorkspaceMemberRole[] = ["viewer", "member", "admin", "owner"];

function hasRole(userRole: string, minRole: string): boolean {
  const userIdx = ROLE_ORDER.indexOf(userRole as WorkspaceMemberRole);
  const minIdx = ROLE_ORDER.indexOf(minRole as WorkspaceMemberRole);
  if (userIdx === -1 || minIdx === -1) return false;
  return userIdx >= minIdx;
}

type GoalPerms = { goals_view_role: string; goals_add_role: string; goals_edit_role: string };

async function getGoalPerms(workspaceId: number): Promise<GoalPerms> {
  const row = await fetchOne<GoalPerms>(
    "SELECT goals_view_role, goals_add_role, goals_edit_role FROM goal_settings WHERE workspace_id = ? LIMIT 1",
    [workspaceId],
  );
  return row || { goals_view_role: "viewer", goals_add_role: "member", goals_edit_role: "member" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { workspaceId, role } = await requireWorkspaceMember(req, wid);

    const perms = await getGoalPerms(workspaceId);
    if (!hasRole(role, perms.goals_view_role)) {
      return NextResponse.json({ message: "You don't have permission to view goals." }, { status: 403 });
    }

    const goalId = parseInt(gid, 10);
    const goal = await fetchOne(
      "SELECT * FROM goals WHERE id = ? AND workspace_id = ? LIMIT 1",
      [goalId, workspaceId],
    );
    if (!goal) return NextResponse.json({ message: "Goal not found." }, { status: 404 });

    const milestones = await fetchMany(
      "SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY sort_order ASC, id ASC",
      [goalId],
    );
    const notes = await fetchMany(
      `SELECT n.*, u.name AS user_name FROM goal_notes n LEFT JOIN User u ON u.id = n.user_id WHERE n.goal_id = ? ORDER BY n.created_at DESC`,
      [goalId],
    );
    const contributions = await fetchMany(
      `SELECT c.*, u.name AS user_name FROM goal_contributions c LEFT JOIN User u ON u.id = c.user_id WHERE c.goal_id = ? ORDER BY c.date DESC, c.id DESC`,
      [goalId],
    );

    return NextResponse.json({ data: { ...goal, milestones, notes, contributions } });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    if (e.status === 404) return NextResponse.json({ message: "Not found." }, { status: 404 });
    console.error("GET goal error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { workspaceId, role } = await requireWorkspaceMember(req, wid);

    const perms = await getGoalPerms(workspaceId);
    if (!hasRole(role, perms.goals_edit_role)) {
      return NextResponse.json({ message: "You don't have permission to edit goals." }, { status: 403 });
    }

    const goalId = parseInt(gid, 10);
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = ["name", "icon", "color", "target_amount", "currency", "deadline", "contribution_frequency", "contribution_amount", "status", "progress"];
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`);
        values.push(body[key] ?? null);
      }
    }

    if (body.status === "completed" && !body.completed_at) {
      fields.push("completed_at = NOW(3)");
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: "No fields to update." }, { status: 422 });
    }

    fields.push("updated_at = NOW(3)");
    values.push(goalId, workspaceId);

    await execute(
      `UPDATE goals SET ${fields.join(", ")} WHERE id = ? AND workspace_id = ?`,
      values,
    );

    return NextResponse.json({ message: "Updated." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    console.error("PATCH goal error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { workspaceId } = await requireWorkspaceAdmin(req, wid);
    const goalId = parseInt(gid, 10);

    await execute("DELETE FROM goals WHERE id = ? AND workspace_id = ?", [goalId, workspaceId]);
    return NextResponse.json({ message: "Deleted." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    console.error("DELETE goal error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
