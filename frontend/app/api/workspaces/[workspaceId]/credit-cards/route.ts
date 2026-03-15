import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchMany, insertOne } from "@/lib/sql";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);

    const cards = await fetchMany(
      `SELECT * FROM CreditCard WHERE workspace_id = ? ORDER BY name ASC`,
      [wid],
    );

    const data = cards.map((c: any) => ({
      ...c,
      credit_limit: Number(c.credit_limit ?? 0),
      current_balance: Number(c.current_balance ?? 0),
    }));

    return NextResponse.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/credit-cards error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceAdmin(req, workspaceId);
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const owner = typeof body.owner === "string" ? body.owner.trim() : null;
    const creditLimit = typeof body.credit_limit === "number" ? body.credit_limit : parseFloat(String(body.credit_limit ?? 0));
    const paymentDueDay = parseInt(String(body.payment_due_day ?? 1), 10);

    if (!name) {
      return NextResponse.json({ message: "Card name is required." }, { status: 422 });
    }
    if (paymentDueDay < 1 || paymentDueDay > 31) {
      return NextResponse.json({ message: "Due day must be between 1 and 31." }, { status: 422 });
    }

    const id = await insertOne(
      `INSERT INTO CreditCard (workspace_id, name, owner, credit_limit, current_balance, billing_cycle_start_day, payment_due_day, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 1, ?, 'BRL', NOW(3), NOW(3))`,
      [wid, name, owner, creditLimit, paymentDueDay],
    );

    const [card] = await fetchMany(`SELECT * FROM CreditCard WHERE id = ? LIMIT 1`, [id]);
    return NextResponse.json({
      data: { ...card, credit_limit: Number(card.credit_limit ?? 0), current_balance: Number(card.current_balance ?? 0) },
    }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/credit-cards error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
