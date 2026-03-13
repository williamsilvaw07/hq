import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { sendInviteEmail } from "@/lib/mail";
import { fetchOne } from "@/lib/sql";
import {
  findWorkspaceMember,
  findPendingInvitation,
  createInvitation,
} from "@/lib/repos/invitation-repo";

const INVITABLE_ROLES = ["admin", "member", "viewer"] as const;
const EXPIRES_DAYS = 7;

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, workspaceId: wid } = await requireWorkspaceAdmin(req, workspaceId);
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "The email must be a valid email address." }, { status: 422 });
    }
    if (!INVITABLE_ROLES.includes(role as (typeof INVITABLE_ROLES)[number])) {
      return NextResponse.json({ message: "Invalid role for invite." }, { status: 422 });
    }

    const workspace = await fetchOne<{ id: number; name: string }>(
      "SELECT id, name FROM Workspace WHERE id = ? LIMIT 1",
      [wid]
    );
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }

    const existingUser = await fetchOne<{ id: number }>("SELECT id FROM User WHERE email = ? LIMIT 1", [email]);
    if (existingUser) {
      const member = await findWorkspaceMember(wid, existingUser.id);
      if (member) {
        return NextResponse.json({ message: "This user is already in the workspace.", errors: { email: ["This user is already in the workspace."] } }, { status: 422 });
      }
    }

    const pending = await findPendingInvitation(wid, email);
    if (pending) {
      return NextResponse.json({ message: "An invitation was already sent to this email.", errors: { email: ["An invitation was already sent to this email."] } }, { status: 422 });
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRES_DAYS);

    const invitationId = await createInvitation({
      workspaceId: wid,
      email,
      role,
      token,
      invitedBy: user.id,
      expiresAt,
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(/\/+$/, "");
    const inviteLink = `${baseUrl}/invite/accept?token=${encodeURIComponent(token)}`;

    await sendInviteEmail(email, workspace.name, inviteLink);

    return NextResponse.json(
      {
        data: {
          id: invitationId,
          email,
          role,
          expires_at: expiresAt.toISOString(),
          invite_link: inviteLink,
        },
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "You do not have permission to manage members." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/members/invite error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
