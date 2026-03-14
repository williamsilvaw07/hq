import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany, fetchOne, execute } from "@/lib/sql";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; cardId: string }> },
) {
  try {
    const { workspaceId, cardId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(cardId, 10);
    if (Number.isNaN(id)) return NextResponse.json({ message: "Card not found." }, { status: 404 });

    const card = await fetchOne<{ id: number }>(
      "SELECT id FROM CreditCard WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid],
    );
    if (!card) return NextResponse.json({ message: "Card not found." }, { status: 404 });

    const body = await req.json();
    const fields: string[] = [];
    const p: any[] = [];

    if (typeof body.name === "string") { fields.push("name = ?"); p.push(body.name.trim()); }
    if (typeof body.owner === "string") { fields.push("owner = ?"); p.push(body.owner.trim() || null); }
    if (body.credit_limit != null) {
      const v = parseFloat(String(body.credit_limit));
      if (!Number.isNaN(v)) { fields.push("credit_limit = ?"); p.push(v); }
    }
    if (body.payment_due_day != null) {
      const d = parseInt(String(body.payment_due_day), 10);
      if (d >= 1 && d <= 31) { fields.push("payment_due_day = ?"); p.push(d); }
    }

    if (fields.length === 0) {
      const [c] = await fetchMany("SELECT * FROM CreditCard WHERE id = ? LIMIT 1", [id]);
      return NextResponse.json({ data: { ...c, credit_limit: Number(c.credit_limit ?? 0), current_balance: Number(c.current_balance ?? 0) } });
    }

    fields.push("updated_at = NOW(3)");
    p.push(id);
    await execute(`UPDATE CreditCard SET ${fields.join(", ")} WHERE id = ?`, p);

    const [updated] = await fetchMany("SELECT * FROM CreditCard WHERE id = ? LIMIT 1", [id]);
    return NextResponse.json({
      data: { ...updated, credit_limit: Number(updated.credit_limit ?? 0), current_balance: Number(updated.current_balance ?? 0) },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id]/credit-cards/[cardId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; cardId: string }> },
) {
  try {
    const { workspaceId, cardId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(cardId, 10);
    if (Number.isNaN(id)) return NextResponse.json({ message: "Card not found." }, { status: 404 });

    const card = await fetchOne<{ id: number }>(
      "SELECT id FROM CreditCard WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid],
    );
    if (!card) return NextResponse.json({ message: "Card not found." }, { status: 404 });

    await execute("DELETE FROM CreditCard WHERE id = ?", [id]);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/credit-cards/[cardId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
