import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany, fetchOne, insertOne, execute } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const contributions = await fetchMany(
      `SELECT c.*, u.name AS user_name FROM goal_contributions c LEFT JOIN User u ON u.id = c.user_id WHERE c.goal_id = ? ORDER BY c.date DESC, c.id DESC`,
      [goalId],
    );
    return NextResponse.json({ data: contributions });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("GET contributions error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { user, workspaceId } = await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const body = await req.json();

    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Valid amount is required." }, { status: 422 });
    }

    // Verify goal belongs to workspace
    const goal = await fetchOne<{ id: number; current_amount: number }>(
      "SELECT id, current_amount FROM goals WHERE id = ? AND workspace_id = ? LIMIT 1",
      [goalId, workspaceId],
    );
    if (!goal) return NextResponse.json({ message: "Goal not found." }, { status: 404 });

    const date = body.date || new Date().toISOString().slice(0, 10);

    const id = await insertOne(
      `INSERT INTO goal_contributions (goal_id, user_id, amount, note, date, created_at) VALUES (?, ?, ?, ?, ?, NOW(3))`,
      [goalId, user.id, amount, body.note?.trim() || null, date],
    );

    // Update goal current_amount
    await execute(
      "UPDATE goals SET current_amount = current_amount + ?, updated_at = NOW(3) WHERE id = ? AND workspace_id = ?",
      [amount, goalId, workspaceId],
    );

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST contribution error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
