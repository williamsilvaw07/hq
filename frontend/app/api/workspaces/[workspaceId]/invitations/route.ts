import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId: workspaceIdNum, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { inviter: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expires_at: inv.expiresAt.toISOString(),
      invited_by: inv.inviter ? { name: inv.inviter.name, email: inv.inviter.email } : null,
    }));

    return NextResponse.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/invitations error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
