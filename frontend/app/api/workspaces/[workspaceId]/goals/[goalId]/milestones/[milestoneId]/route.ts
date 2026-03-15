import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { execute } from "@/lib/sql";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string; milestoneId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid, milestoneId: mid } = await params;
    await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const milestoneId = parseInt(mid, 10);
    const body = await req.json();

    const fields: string[] = [];
    const values: any[] = [];

    if ("title" in body) { fields.push("title = ?"); values.push(body.title); }
    if ("target_amount" in body) { fields.push("target_amount = ?"); values.push(body.target_amount); }
    if ("target_date" in body) { fields.push("target_date = ?"); values.push(body.target_date); }
    if ("sort_order" in body) { fields.push("sort_order = ?"); values.push(body.sort_order); }
    if ("is_completed" in body) {
      fields.push("is_completed = ?");
      values.push(body.is_completed ? 1 : 0);
      if (body.is_completed) {
        fields.push("completed_at = NOW(3)");
      } else {
        fields.push("completed_at = NULL");
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: "No fields to update." }, { status: 422 });
    }

    fields.push("updated_at = NOW(3)");
    values.push(milestoneId, goalId);

    await execute(
      `UPDATE goal_milestones SET ${fields.join(", ")} WHERE id = ? AND goal_id = ?`,
      values,
    );

    return NextResponse.json({ message: "Updated." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("PATCH milestone error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string; milestoneId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid, milestoneId: mid } = await params;
    await requireWorkspaceMember(req, wid);
    const milestoneId = parseInt(mid, 10);
    const goalId = parseInt(gid, 10);

    await execute("DELETE FROM goal_milestones WHERE id = ? AND goal_id = ?", [milestoneId, goalId]);
    return NextResponse.json({ message: "Deleted." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("DELETE milestone error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
