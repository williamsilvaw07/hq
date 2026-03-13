import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchOne, fetchMany, execute } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; budgetId: string }> }
) {
  try {
    const { workspaceId, budgetId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(budgetId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    const [budget] = await fetchMany(
      `SELECT b.*, c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
       FROM budgets b
       LEFT JOIN Category c ON c.id = b.category_id
       WHERE b.id = ? AND b.workspace_id = ?
       LIMIT 1`,
      [id, wid]
    );
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    const b = { ...budget, amount: Number(budget.amount) };
    return NextResponse.json({ data: b });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/budgets/[budgetId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; budgetId: string }> }
) {
  try {
    const { workspaceId, budgetId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(budgetId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    const [budget] = await fetchMany(
      `SELECT b.*, c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
       FROM budgets b
       LEFT JOIN Category c ON c.id = b.category_id
       WHERE b.id = ? AND b.workspace_id = ?
       LIMIT 1`,
      [id, wid]
    );
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }

    const body = await req.json();
    const fields: string[] = [];
    const paramsArr: any[] = [];

    if (typeof body.name === "string") {
      fields.push("name = ?");
      paramsArr.push(body.name.trim() || null);
    }
    if (body.icon !== undefined) {
      fields.push("icon = ?");
      paramsArr.push(typeof body.icon === "string" ? body.icon : null);
    }
    if (body.month != null) {
      const m = parseInt(String(body.month), 10);
      if (m < 1 || m > 12) return NextResponse.json({ message: "Invalid month." }, { status: 422 });
      fields.push("month = ?");
      paramsArr.push(m);
    }
    if (body.year != null) {
      const y = parseInt(String(body.year), 10);
      if (y < 2020 || y > 2100) return NextResponse.json({ message: "Invalid year." }, { status: 422 });
      fields.push("year = ?");
      paramsArr.push(y);
    }
    if (body.period_type != null) {
      if (!["day", "week", "month", "year"].includes(String(body.period_type))) {
        return NextResponse.json({ message: "Invalid period_type." }, { status: 422 });
      }
      fields.push("period_type = ?");
      paramsArr.push(body.period_type);
    }
    if (body.period_interval != null) {
      fields.push("period_interval = ?");
      paramsArr.push(Math.min(12, Math.max(1, parseInt(String(body.period_interval), 10))));
    }
    if (body.amount != null) {
      const a = parseFloat(String(body.amount));
      if (a < 0 || Number.isNaN(a)) return NextResponse.json({ message: "Invalid amount." }, { status: 422 });
      fields.push("amount = ?");
      paramsArr.push(a);
    }

    if (fields.length === 0) {
      const u = { ...budget, amount: Number(budget.amount) };
      return NextResponse.json({ data: u });
    }

    fields.push("updated_at = NOW(3)");
    paramsArr.push(id);
    await execute(`UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`, paramsArr);

    const [updated] = await fetchMany(
      `SELECT b.*, c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
       FROM budgets b
       LEFT JOIN Category c ON c.id = b.category_id
       WHERE b.id = ? AND b.workspace_id = ?
       LIMIT 1`,
      [id, wid]
    );
    const u = { ...updated, amount: Number(updated.amount) };
    return NextResponse.json({ data: u });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id]/budgets/[budgetId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; budgetId: string }> }
) {
  try {
    const { workspaceId, budgetId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(budgetId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    const budget = await fetchOne<{ id: number }>(
      "SELECT id FROM budgets WHERE id = ? AND workspace_id = ? LIMIT 1",
      [id, wid]
    );
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    await execute("DELETE FROM budgets WHERE id = ?", [id]);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/budgets/[budgetId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
