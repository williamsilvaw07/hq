import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** GET ?token=... - public, returns invitation details for the accept page. */
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "Invalid or expired invitation." }, { status: 404 });
    }

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { workspace: true },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invalid or expired invitation." }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        workspace_name: invitation.workspace?.name ?? "",
        email: invitation.email,
        role: invitation.role,
      },
    });
  } catch (e) {
    console.error("GET /api/invitations/accept error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

/** POST { token } - requires auth, accepts the invitation. */
export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ message: "Token is required.", errors: { token: ["Token is required."] } }, { status: 422 });
    }

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: { token, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { workspace: true },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invalid or expired invitation.", errors: { token: ["Invalid or expired invitation."] } }, { status: 422 });
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ message: "This invitation was sent to another email address.", errors: { email: ["This invitation was sent to another email address."] } }, { status: 422 });
    }

    const existing = await prisma.workspaceUser.findUnique({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ message: "You are already a member of this workspace.", errors: { workspace: ["You are already a member of this workspace."] } }, { status: 422 });
    }

    await prisma.$transaction([
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
      prisma.workspaceUser.create({
        data: { workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role },
      }),
    ]);

    const workspace = await prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      message: "Invitation accepted.",
      data: { workspace: workspace ?? { id: invitation.workspaceId, name: invitation.workspace?.name ?? "", slug: invitation.workspace?.slug ?? "" } },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST /api/invitations/accept error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
