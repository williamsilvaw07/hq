import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";

const ROLES = ["owner", "admin", "member", "viewer"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const memberUserId = parseInt(memberId, 10); // frontend passes user_id

    const body = await req.json();
    const role = typeof body.role === "string" ? body.role : "";
    if (!ROLES.includes(role as (typeof ROLES)[number]) || role === "owner") {
      return NextResponse.json({ message: "Invalid role.", errors: { role: ["Invalid role."] } }, { status: 422 });
    }

    const membership = await prisma.workspaceUser.findUnique({
      where: { workspaceId_userId: { workspaceId: workspaceIdNum, userId: memberUserId } },
    });
    if (!membership) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (membership.role === "owner") {
      return NextResponse.json({ message: "Cannot change owner role.", errors: { member: ["Cannot change owner role."] } }, { status: 422 });
    }

    await prisma.workspaceUser.update({
      where: { workspaceId_userId: { workspaceId: workspaceIdNum, userId: memberUserId } },
      data: { role },
    });
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
    const memberUserId = parseInt(memberId, 10); // frontend passes user_id

    const membership = await prisma.workspaceUser.findUnique({
      where: { workspaceId_userId: { workspaceId: workspaceIdNum, userId: memberUserId } },
    });
    if (!membership) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (membership.role === "owner") {
      return NextResponse.json({ message: "Cannot remove the owner.", errors: { member: ["Cannot remove the owner."] } }, { status: 403 });
    }

    await prisma.workspaceUser.delete({
      where: { workspaceId_userId: { workspaceId: workspaceIdNum, userId: memberUserId } },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission." }, { status: 403 });
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
