import { NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { listInvitations } from "@/lib/repos/invitation-repo";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);

    const invitations = await listInvitations(workspaceIdNum);

    const data = invitations.map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expires_at: typeof inv.expires_at === "string" ? inv.expires_at : new Date(inv.expires_at).toISOString(),
      invited_by: inv.inviter_name ? { name: inv.inviter_name, email: inv.inviter_email } : null,
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
