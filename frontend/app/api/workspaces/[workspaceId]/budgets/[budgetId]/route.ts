import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { Decimal } from "@prisma/client/runtime/library";

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
    const budget = await prisma.budget.findFirst({
      where: { id, workspaceId: wid },
      include: { category: true },
    });
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
    const budget = await prisma.budget.findFirst({
      where: { id, workspaceId: wid },
      include: { category: true },
    });
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }

    const body = await req.json();
    const data: { month?: number; year?: number; periodType?: string; periodInterval?: number; amount?: Decimal } = {};
    if (body.month != null) {
      const m = parseInt(String(body.month), 10);
      if (m < 1 || m > 12) return NextResponse.json({ message: "Invalid month." }, { status: 422 });
      data.month = m;
    }
    if (body.year != null) {
      const y = parseInt(String(body.year), 10);
      if (y < 2020 || y > 2100) return NextResponse.json({ message: "Invalid year." }, { status: 422 });
      data.year = y;
    }
    if (body.period_type != null) {
      if (!["day", "week", "month", "year"].includes(String(body.period_type))) {
        return NextResponse.json({ message: "Invalid period_type." }, { status: 422 });
      }
      data.periodType = body.period_type;
    }
    if (body.period_interval != null) {
      data.periodInterval = Math.min(12, Math.max(1, parseInt(String(body.period_interval), 10)));
    }
    if (body.amount != null) {
      const a = parseFloat(String(body.amount));
      if (a < 0 || Number.isNaN(a)) return NextResponse.json({ message: "Invalid amount." }, { status: 422 });
      data.amount = new Decimal(a);
    }

    if (Object.keys(data).length === 0) {
      const u = { ...budget, amount: Number(budget.amount) };
      return NextResponse.json({ data: u });
    }
    const updated = await prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });
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
    const budget = await prisma.budget.findFirst({
      where: { id, workspaceId: wid },
    });
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    await prisma.budget.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/budgets/[budgetId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
