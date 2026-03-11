import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { getCurrentPeriod } from "@/lib/budget-period";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const url = new URL(req.url);
    const withSummaries = url.searchParams.get("with_summaries") === "true";
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    if (withSummaries) {
      const budgets = await prisma.budget.findMany({
        where: { workspaceId: wid },
        include: { category: true },
      });

      const result = await Promise.all(
        budgets.map(async (budget) => {
          const period = getCurrentPeriod({
            periodType: budget.periodType,
            periodInterval: budget.periodInterval,
            startDate: budget.startDate,
          });
          const startStr = period.start.toISOString().slice(0, 10);
          const endStr = period.end.toISOString().slice(0, 10);
          const nextResetStr = period.next_reset.toISOString().slice(0, 10);

          const spentAgg = await prisma.transaction.aggregate({
            where: {
              workspaceId: wid,
              status: "confirmed",
              type: "expense",
              categoryId: budget.categoryId,
              date: { gte: period.start, lte: period.end },
            },
            _sum: { baseAmount: true },
          });
          const spent = Number(spentAgg._sum.baseAmount ?? 0);
          const amount = Number(budget.amount);
          const remaining = Math.max(0, amount - spent);
          const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;

          return {
            id: budget.id,
            category: budget.category
              ? { id: budget.category.id, name: budget.category.name, icon: budget.category.icon, color: budget.category.color }
              : null,
            amount,
            currency: budget.currency,
            period_type: budget.periodType,
            period_interval: budget.periodInterval,
            current_period_start: startStr,
            current_period_end: endStr,
            next_reset_date: nextResetStr,
            spent,
            remaining,
            spent_percentage: pct,
          };
        })
      );
      return NextResponse.json({ data: result });
    }

    const where: { workspaceId: number; month?: number; year?: number } = { workspaceId: wid };
    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ month: "asc" }, { year: "asc" }],
    });
    return NextResponse.json({ data: budgets });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/budgets error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const body = await req.json();
    const categoryId = body.category_id != null ? parseInt(String(body.category_id), 10) : NaN;
    const month = body.month != null ? parseInt(String(body.month), 10) : NaN;
    const year = body.year != null ? parseInt(String(body.year), 10) : NaN;
    const periodType = (typeof body.period_type === "string" ? body.period_type : "month") as string;
    const periodInterval = body.period_interval != null ? Math.min(12, Math.max(1, parseInt(String(body.period_interval), 10))) : 1;
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0));
    const currency = typeof body.currency === "string" && body.currency.length === 3 ? body.currency : "BRL";

    if (Number.isNaN(categoryId) || Number.isNaN(month) || Number.isNaN(year)) {
      return NextResponse.json({ message: "category_id, month and year are required." }, { status: 422 });
    }
    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return NextResponse.json({ message: "Invalid month or year." }, { status: 422 });
    }
    if (amount < 0 || Number.isNaN(amount)) {
      return NextResponse.json({ message: "Amount must be a non-negative number." }, { status: 422 });
    }
    if (!["day", "week", "month", "year"].includes(periodType)) {
      return NextResponse.json({ message: "Invalid period_type." }, { status: 422 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId: wid },
    });
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 422 });
    }

    const budget = await prisma.budget.create({
      data: {
        workspaceId: wid,
        categoryId,
        month,
        year,
        periodType,
        periodInterval,
        amount: new Decimal(amount),
        currency,
      },
      include: { category: true },
    });
    const b = budget as unknown as Record<string, unknown>;
    b.amount = Number(budget.amount);
    return NextResponse.json({ data: b }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/budgets error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
