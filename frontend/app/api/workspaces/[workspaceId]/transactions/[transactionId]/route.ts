import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchOne } from "@/lib/sql";
import {
  findTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/lib/repos/transaction-repo";

function toResponse(t: any) {
  return {
    ...t,
    amount: Number(t.amount),
    base_amount: Number(t.base_amount ?? t.amount),
    exchange_rate: Number(t.exchange_rate ?? 1),
    date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
    account: t.acc_id ? { id: t.acc_id, name: t.acc_name } : null,
    category: t.cat_id ? { id: t.cat_id, name: t.cat_name } : null,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; transactionId: string }> }
) {
  try {
    const { workspaceId, transactionId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(transactionId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    const transaction = await findTransactionById(id, wid);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    return NextResponse.json({ data: toResponse(transaction) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/transactions/[transactionId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; transactionId: string }> }
) {
  try {
    const { workspaceId, transactionId } = await params;
    const { user, workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(transactionId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    const transaction = await findTransactionById(id, wid);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }

    const body = await req.json();
    const data: {
      categoryId?: number;
      type?: string;
      amount?: number;
      currency?: string;
      date?: string;
      description?: string | null;
      status?: string;
      confirmedAt?: Date | null;
      confirmedByUserId?: number | null;
    } = {};

    if (body.category_id !== undefined) {
      const cid = parseInt(String(body.category_id), 10);
      const cat = await fetchOne<{ id: number }>("SELECT id FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1", [cid, wid]);
      if (!cat) return NextResponse.json({ message: "Category not found." }, { status: 422 });
      data.categoryId = cid;
    }
    if (body.type === "income" || body.type === "expense") data.type = body.type;
    if (body.amount !== undefined) {
      const a = parseFloat(String(body.amount));
      if (!Number.isNaN(a)) data.amount = a;
    }
    if (typeof body.currency === "string" && body.currency.length === 3) data.currency = body.currency;
    if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) data.date = body.date;
    if (body.description !== undefined) data.description = body.description === null ? null : String(body.description);
    if (body.status === "draft" || body.status === "confirmed" || body.status === "needs_review") {
      data.status = body.status;
      if (body.status === "confirmed") {
        data.confirmedAt = new Date();
        data.confirmedByUserId = user.id;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ data: toResponse(transaction) });
    }

    await updateTransaction(id, data);
    const updated = await findTransactionById(id, wid);
    return NextResponse.json({ data: toResponse(updated!) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id]/transactions/[transactionId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; transactionId: string }> }
) {
  try {
    const { workspaceId, transactionId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const id = parseInt(transactionId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    const transaction = await findTransactionById(id, wid);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    await deleteTransaction(id);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/transactions/[transactionId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
