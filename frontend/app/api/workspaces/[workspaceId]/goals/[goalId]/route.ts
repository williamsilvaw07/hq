import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchOne, fetchMany, execute } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { workspaceId } = await requireWorkspaceMember(req, wid);
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
    const { workspaceId } = await requireWorkspaceMember(req, wid);
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
