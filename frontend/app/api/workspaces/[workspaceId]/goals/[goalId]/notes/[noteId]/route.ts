import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { execute } from "@/lib/sql";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; goalId: string; noteId: string }> },
) {
  try {
    const { workspaceId: wid, goalId: gid, noteId: nid } = await params;
    await requireWorkspaceMember(req, wid);
    const noteId = parseInt(nid, 10);
    const goalId = parseInt(gid, 10);
    await execute("DELETE FROM goal_notes WHERE id = ? AND goal_id = ?", [noteId, goalId]);
    return NextResponse.json({ message: "Deleted." });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("DELETE note error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
