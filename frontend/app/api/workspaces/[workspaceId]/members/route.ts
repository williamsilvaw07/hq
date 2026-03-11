import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import type { WorkspaceMemberInfo } from "@/lib/workspace-auth";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceMember(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);

    const rows = await prisma.workspaceUser.findMany({
      where: { workspaceId: workspaceIdNum },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const data: WorkspaceMemberInfo[] = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      role: r.role,
      name: r.user?.name ?? "",
      email: r.user?.email ?? "",
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
