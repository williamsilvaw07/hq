import { NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchOne, execute } from "@/lib/sql";

const ROLES = ["owner", "admin", "member", "viewer"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const memberUserId = parseInt(memberId, 10);

    const body = await req.json();
    const role = typeof body.role === "string" ? body.role : "";
    if (!ROLES.includes(role as (typeof ROLES)[number]) || role === "owner") {
      return NextResponse.json({ message: "Invalid role.", errors: { role: ["Invalid role."] } }, { status: 422 });
    }

    const membership = await fetchOne<{ id: number; role: string }>(
      "SELECT id, role FROM workspace_users WHERE workspace_id = ? AND user_id = ? LIMIT 1",
      [workspaceIdNum, memberUserId]
    );
    if (!membership) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (membership.role === "owner") {
      return NextResponse.json({ message: "Cannot change owner role.", errors: { member: ["Cannot change owner role."] } }, { status: 422 });
    }

    await execute("UPDATE workspace_users SET role = ?, updated_at = NOW(3) WHERE workspace_id = ? AND user_id = ?", [
      role,
      workspaceIdNum,
      memberUserId,
    ]);
    return NextResponse.json({ message: "Updated." });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission." }, { status: 403 });
    console.error("PATCH /api/workspaces/[id]/members/[memberId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const memberUserId = parseInt(memberId, 10);

    const membership = await fetchOne<{ id: number; role: string }>(
      "SELECT id, role FROM workspace_users WHERE workspace_id = ? AND user_id = ? LIMIT 1",
      [workspaceIdNum, memberUserId]
    );
    if (!membership) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (membership.role === "owner") {
      return NextResponse.json({ message: "Cannot remove the owner.", errors: { member: ["Cannot remove the owner."] } }, { status: 403 });
    }

    await execute("DELETE FROM workspace_users WHERE workspace_id = ? AND user_id = ?", [
      workspaceIdNum,
      memberUserId,
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission." }, { status: 403 });
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
