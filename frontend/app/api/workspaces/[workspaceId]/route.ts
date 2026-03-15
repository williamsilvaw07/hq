import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchOne, execute } from "@/lib/sql";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const workspace = await fetchOne<{ id: number; name: string; slug: string; currency: string }>(
      "SELECT id, name, slug, COALESCE(currency, 'BRL') AS currency FROM Workspace WHERE id = ? LIMIT 1",
      [wid],
    );
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json({ data: workspace });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    const msg = (e as Error).message || "Unknown error";
    console.error("GET /api/workspaces/[id] error:", { status, msg, stack: (e as Error).stack });
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: `Workspace not found: ${msg}` }, { status: 404 });
    return NextResponse.json({ message: `Request failed: ${msg}` }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceAdmin(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const slug = typeof body.slug === "string" ? body.slug.trim() : undefined;
    const VALID_CURRENCIES = ["BRL", "USD", "EUR", "GBP", "ARS", "CLP", "COP", "MXN"];
    const currency = typeof body.currency === "string" && VALID_CURRENCIES.includes(body.currency.toUpperCase())
      ? body.currency.toUpperCase()
      : undefined;

    const workspace = await fetchOne<{ id: number; name: string; slug: string; currency: string }>(
      "SELECT id, name, slug, COALESCE(currency, 'BRL') AS currency FROM Workspace WHERE id = ? LIMIT 1",
      [workspaceIdNum],
    );
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }

    const data: { name?: string; slug?: string; currency?: string } = {};
    if (name !== undefined) data.name = name;
    if (currency !== undefined) data.currency = currency;
    if (slug !== undefined) {
      const existing = await fetchOne<{ id: number }>(
        "SELECT id FROM Workspace WHERE slug = ? AND id <> ? LIMIT 1",
        [slug, workspaceIdNum],
      );
      if (existing) {
        return NextResponse.json({ message: "The slug has already been taken." }, { status: 422 });
      }
      data.slug = slug;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ data: workspace });
    }

    const sets: string[] = [];
    const vals: any[] = [];
    if (data.name !== undefined) { sets.push("name = ?"); vals.push(data.name); }
    if (data.slug !== undefined) { sets.push("slug = ?"); vals.push(data.slug); }
    if (data.currency !== undefined) { sets.push("currency = ?"); vals.push(data.currency); }
    if (sets.length > 0) {
      await execute(`UPDATE Workspace SET ${sets.join(", ")}, updated_at = NOW(3) WHERE id = ?`, [...vals, workspaceIdNum]);
    }
    const updated = await fetchOne<{ id: number; name: string; slug: string; currency: string }>(
      "SELECT id, name, slug, COALESCE(currency, 'BRL') AS currency FROM Workspace WHERE id = ? LIMIT 1",
      [workspaceIdNum],
    );
    return NextResponse.json({ data: updated });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const { role, workspaceId: workspaceIdNum } = await requireWorkspaceMember(
      req,
      workspaceId,
    );
    if (role !== "owner") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }
    await execute("DELETE FROM Workspace WHERE id = ?", [workspaceIdNum]);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
