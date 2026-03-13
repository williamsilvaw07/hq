import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchOne } from "@/lib/sql";
import { getPool } from "@/lib/db";
import {
  findInvitationByToken,
  findWorkspaceMember,
} from "@/lib/repos/invitation-repo";

/** GET ?token=... - public, returns invitation details for the accept page. */
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "Invalid or expired invitation." }, { status: 404 });
    }

    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ message: "Invalid or expired invitation." }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        workspace_name: invitation.workspace_name ?? "",
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

    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ message: "Invalid or expired invitation.", errors: { token: ["Invalid or expired invitation."] } }, { status: 422 });
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ message: "This invitation was sent to another email address.", errors: { email: ["This invitation was sent to another email address."] } }, { status: 422 });
    }

    const existing = await findWorkspaceMember(invitation.workspace_id, user.id);
    if (existing) {
      return NextResponse.json({ message: "You are already a member of this workspace.", errors: { workspace: ["You are already a member of this workspace."] } }, { status: 422 });
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query(
        "UPDATE workspace_invitations SET accepted_at = NOW(3), updated_at = NOW(3) WHERE id = ?",
        [invitation.id]
      );
      await conn.query(
        "INSERT INTO workspace_users (workspace_id, user_id, role, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
        [invitation.workspace_id, user.id, invitation.role]
      );
      await conn.query("COMMIT");
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }

    const workspace = await fetchOne<{ id: number; name: string; slug: string }>(
      "SELECT id, name, slug FROM Workspace WHERE id = ? LIMIT 1",
      [invitation.workspace_id]
    );

    return NextResponse.json({
      message: "Invitation accepted.",
      data: {
        workspace: workspace ?? { id: invitation.workspace_id, name: invitation.workspace_name ?? "", slug: "" },
      },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST /api/invitations/accept error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
