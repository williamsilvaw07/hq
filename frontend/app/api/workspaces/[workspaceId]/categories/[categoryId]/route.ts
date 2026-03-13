import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchOne, fetchMany, execute } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; categoryId: string }> }
) {
  try {
    const { workspaceId, categoryId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(categoryId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    const category = await fetchOne(
      "SELECT id, workspace_id AS workspaceId, name, type, icon, color, created_at AS createdAt, updated_at AS updatedAt FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid]
    );
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ data: category });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/categories/[categoryId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; categoryId: string }> }
) {
  try {
    const { workspaceId, categoryId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(categoryId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    const category = await fetchOne(
      "SELECT id, workspace_id AS workspaceId, name, type, icon, color, created_at AS createdAt, updated_at AS updatedAt FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid]
    );
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const type = typeof body.type === "string" ? body.type : undefined;
    const icon = body.icon !== undefined ? (body.icon === null ? null : String(body.icon)) : undefined;
    const color = body.color !== undefined ? (body.color === null ? null : String(body.color)) : undefined;

    if (name !== undefined && (name.length === 0 || name.length > 255)) {
      return NextResponse.json({ message: "Invalid name." }, { status: 422 });
    }
    if (type !== undefined && type !== "income" && type !== "expense") {
      return NextResponse.json({ message: "The type must be income or expense." }, { status: 422 });
    }

    const fields: string[] = [];
    const paramsArr: any[] = [];
    if (name !== undefined) {
      fields.push("name = ?");
      paramsArr.push(name);
    }
    if (type !== undefined) {
      fields.push("type = ?");
      paramsArr.push(type);
    }
    if (icon !== undefined) {
      fields.push("icon = ?");
      paramsArr.push(icon);
    }
    if (color !== undefined) {
      fields.push("color = ?");
      paramsArr.push(color);
    }

    if (fields.length === 0) {
      return NextResponse.json({ data: category });
    }

    fields.push("updated_at = NOW(3)");
    paramsArr.push(id);
    await execute(`UPDATE Category SET ${fields.join(", ")} WHERE id = ?`, paramsArr);

    const updated = await fetchOne(
      "SELECT id, workspace_id AS workspaceId, name, type, icon, color, created_at AS createdAt, updated_at AS updatedAt FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid]
    );
    return NextResponse.json({ data: updated });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id]/categories/[categoryId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; categoryId: string }> }
) {
  try {
    const { workspaceId, categoryId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(categoryId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    const category = await fetchOne(
      "SELECT id FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid]
    );
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    await execute("DELETE FROM Category WHERE id = ?", [id]);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/categories/[categoryId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
