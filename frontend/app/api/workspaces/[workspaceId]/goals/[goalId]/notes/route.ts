import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany, insertOne } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const notes = await fetchMany(
      `SELECT n.*, u.name AS user_name FROM goal_notes n LEFT JOIN User u ON u.id = n.user_id WHERE n.goal_id = ? ORDER BY n.created_at DESC`,
      [goalId],
    );
    return NextResponse.json({ data: notes });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("GET notes error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid } = await params;
    const { user } = await requireWorkspaceMember(req, wid);
    const goalId = parseInt(gid, 10);
    const body = await req.json();

    if (!body.content?.trim()) {
      return NextResponse.json({ message: "Content is required." }, { status: 422 });
    }

    const id = await insertOne(
      `INSERT INTO goal_notes (goal_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))`,
      [goalId, user.id, body.content.trim()],
    );

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST note error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
