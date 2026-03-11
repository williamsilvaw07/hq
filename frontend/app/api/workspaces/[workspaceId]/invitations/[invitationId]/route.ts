import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; invitationId: string }> }
) {
  try {
    const { workspaceId, invitationId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const invitationIdNum = parseInt(invitationId, 10);

    const deleted = await prisma.workspaceInvitation.deleteMany({
      where: {
        id: invitationIdNum,
        workspaceId: workspaceIdNum,
        acceptedAt: null,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ message: "Invitation not found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission." }, { status: 403 });
    console.error("DELETE /api/workspaces/[id]/invitations/[invitationId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
