import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import type { WorkspaceMemberInfo } from "@/lib/workspace-auth";
import { fetchMany } from "@/lib/sql";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceMember(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);

    const rows = await fetchMany<{ id: number; user_id: number; role: string; name: string; email: string }>(
      `SELECT wu.id, wu.user_id AS user_id, wu.role, u.name, u.email
       FROM workspace_users wu
       JOIN User u ON u.id = wu.user_id
       WHERE wu.workspace_id = ?
       ORDER BY wu.id ASC`,
      [workspaceIdNum]
    );

    const data: WorkspaceMemberInfo[] = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      name: r.name ?? "",
      email: r.email ?? "",
    }));

    return NextResponse.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/members error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
