import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const searchParams = new URL(req.url).searchParams;
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const categoryId = searchParams.get("category_id");
    const accountId = searchParams.get("account_id");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") ?? "15", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const where: {
      workspaceId: number;
      status?: string;
      type?: string;
      categoryId?: number;
      accountId?: number;
      date?: { gte?: Date; lte?: Date };
      description?: { contains: string };
    } = { workspaceId: wid };
    if (status) where.status = status;
    if (type && (type === "income" || type === "expense")) where.type = type;
    if (search) where.description = { contains: search };
    if (categoryId) where.categoryId = parseInt(categoryId, 10);
    if (accountId) where.accountId = parseInt(accountId, 10);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { account: true, category: true, createdByUser: { select: { id: true, name: true, email: true } } },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const lastPage = Math.ceil(total / perPage) || 1;
    const list = rows.map((t) => ({
      id: t.id,
      workspace_id: t.workspaceId,
      account_id: t.accountId,
      category_id: t.categoryId,
      created_by_user_id: t.createdByUserId,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      exchange_rate: Number(t.exchangeRate),
      base_amount: Number(t.baseAmount),
      date: t.date.toISOString().slice(0, 10),
      description: t.description,
      source: t.source,
      status: t.status,
      confirmed_at: t.confirmedAt?.toISOString() ?? null,
      confirmed_by_user_id: t.confirmedByUserId,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
      account: t.account,
      category: t.category,
      created_by_user: t.createdByUser,
    }));

    // Pagination shape: frontend expects { data: { data: list, current_page, last_page, per_page } }
    return NextResponse.json({
      data: {
        data: list,
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total === 0 ? null : (page - 1) * perPage + 1,
        to: total === 0 ? null : Math.min(page * perPage, total),
      },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/transactions error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const body = await req.json();
    const categoryId = body.category_id != null ? parseInt(String(body.category_id), 10) : NaN;
    const type = typeof body.type === "string" ? body.type : "";
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0));
    const currency = (typeof body.currency === "string" && body.currency.length === 3) ? body.currency : "BRL";
    const date = typeof body.date === "string" ? body.date : "";
    const description = typeof body.description === "string" ? body.description : null;
    const status = (body.status === "draft" || body.status === "confirmed" ? body.status : "confirmed") as string;

    if (Number.isNaN(categoryId)) {
      return NextResponse.json({ message: "category_id is required." }, { status: 422 });
    }
    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ message: "type must be income or expense." }, { status: 422 });
    }
    if (Number.isNaN(amount)) {
      return NextResponse.json({ message: "amount is required." }, { status: 422 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: "date is required and must be YYYY-MM-DD." }, { status: 422 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId: wid },
    });
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 422 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        workspaceId: wid,
        accountId: null,
        categoryId,
        createdByUserId: user.id,
        type,
        amount: new Decimal(amount),
        currency,
        exchangeRate: new Decimal(1),
        baseAmount: new Decimal(amount),
        date: new Date(date),
        description: description ?? undefined,
        source: "web_manual",
        status,
      },
      include: { account: true, category: true },
    });

    const t = {
      ...transaction,
      amount: Number(transaction.amount),
      exchange_rate: Number(transaction.exchangeRate),
      base_amount: Number(transaction.baseAmount),
      date: transaction.date.toISOString().slice(0, 10),
    };
    return NextResponse.json({ data: t }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/transactions error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
