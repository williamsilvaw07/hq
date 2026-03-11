import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { Decimal } from "@prisma/client/runtime/library";

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
    const transaction = await prisma.transaction.findFirst({
      where: { id, workspaceId: wid },
      include: { account: true, category: true },
    });
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    const t = {
      ...transaction,
      amount: Number(transaction.amount),
      base_amount: Number(transaction.baseAmount),
      exchange_rate: Number(transaction.exchangeRate),
      date: transaction.date.toISOString().slice(0, 10),
    };
    return NextResponse.json({ data: t });
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
    const transaction = await prisma.transaction.findFirst({
      where: { id, workspaceId: wid },
      include: { account: true, category: true },
    });
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }

    const body = await req.json();
    const data: {
      categoryId?: number;
      type?: string;
      amount?: Decimal;
      currency?: string;
      date?: Date;
      description?: string | null;
      status?: string;
      confirmedAt?: Date | null;
      confirmedByUserId?: number | null;
    } = {};

    if (body.category_id !== undefined) {
      const cid = parseInt(String(body.category_id), 10);
      const cat = await prisma.category.findFirst({ where: { id: cid, workspaceId: wid } });
      if (!cat) return NextResponse.json({ message: "Category not found." }, { status: 422 });
      data.categoryId = cid;
    }
    if (body.type === "income" || body.type === "expense") data.type = body.type;
    if (body.amount !== undefined) {
      const a = parseFloat(String(body.amount));
      if (!Number.isNaN(a)) data.amount = new Decimal(a);
    }
    if (typeof body.currency === "string" && body.currency.length === 3) data.currency = body.currency;
    if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) data.date = new Date(body.date);
    if (body.description !== undefined) data.description = body.description === null ? null : String(body.description);
    if (body.status === "draft" || body.status === "confirmed" || body.status === "needs_review") {
      data.status = body.status;
      if (body.status === "confirmed") {
        data.confirmedAt = new Date();
        data.confirmedByUserId = user.id;
      }
    }

    if (Object.keys(data).length === 0) {
      const u = {
        ...transaction,
        amount: Number(transaction.amount),
        base_amount: Number(transaction.baseAmount),
        exchange_rate: Number(transaction.exchangeRate),
        date: transaction.date.toISOString().slice(0, 10),
      };
      return NextResponse.json({ data: u });
    }
    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: { account: true, category: true },
    });
    const u = {
      ...updated,
      amount: Number(updated.amount),
      base_amount: Number(updated.baseAmount),
      exchange_rate: Number(updated.exchangeRate),
      date: updated.date.toISOString().slice(0, 10),
    };
    return NextResponse.json({ data: u });
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
    const transaction = await prisma.transaction.findFirst({
      where: { id, workspaceId: wid },
    });
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }
    await prisma.transaction.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/transactions/[transactionId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
