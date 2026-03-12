import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany, insertOne } from "@/lib/sql";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const categories = await fetchMany(
      `SELECT id, workspace_id AS workspaceId, name, type, icon, color, created_at AS createdAt, updated_at AS updatedAt
       FROM Category
       WHERE workspace_id = ?
       ORDER BY name ASC`,
      [wid],
    );
    return NextResponse.json({ data: categories });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/categories error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = typeof body.type === "string" ? body.type : "";
    const icon = typeof body.icon === "string" ? body.icon : null;
    const color = typeof body.color === "string" ? body.color : null;

    if (!name || name.length > 255) {
      return NextResponse.json({ message: "The name field is required." }, { status: 422 });
    }
    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ message: "The type must be income or expense." }, { status: 422 });
    }

    const id = await insertOne(
      `INSERT INTO Category (workspace_id, name, type, icon, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [wid, name, type, icon, color],
    );
    const [category] = await fetchMany(
      `SELECT id, workspace_id AS workspaceId, name, type, icon, color, created_at AS createdAt, updated_at AS updatedAt
       FROM Category
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/categories error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
