import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany, fetchOne, insertOne } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const milestones = await fetchMany(
      "SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY sort_order ASC, id ASC",
      [goalId],
    );
    return NextResponse.json({ data: milestones });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("GET milestones error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ message: "Title is required." }, { status: 422 });
    }

    const maxOrder = await fetchOne<{ max_order: number | null }>(
      "SELECT MAX(sort_order) AS max_order FROM goal_milestones WHERE goal_id = ?",
      [goalId],
    );

    const id = await insertOne(
      `INSERT INTO goal_milestones (goal_id, title, target_amount, target_date, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [goalId, body.title.trim(), body.target_amount || null, body.target_date || null, (maxOrder?.max_order ?? -1) + 1],
    );

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST milestone error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
