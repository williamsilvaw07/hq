import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchOne } from "@/lib/sql";
import {
  countTransactions,
  findTransactions,
  findTransactionById,
  createTransaction,
} from "@/lib/repos/transaction-repo";

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

    const where = {
      workspaceId: wid,
      status,
      type: type === "income" || type === "expense" ? type : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
      dateFrom: from,
      dateTo: to,
      search: search?.trim() || undefined,
    };

    const [total, rows] = await Promise.all([
      countTransactions(where),
      findTransactions(where, {
        orderBy: "t.date DESC, t.id DESC",
        limit: perPage,
        offset: (page - 1) * perPage,
      }),
    ]);

    const lastPage = Math.ceil(total / perPage) || 1;
    const list = rows.map((t: any) => ({
      id: t.id,
      workspace_id: t.workspace_id,
      account_id: t.account_id,
      category_id: t.category_id,
      created_by_user_id: t.created_by_user_id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      exchange_rate: Number(t.exchange_rate ?? 1),
      base_amount: Number(t.base_amount ?? t.amount),
      date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
      description: t.description,
      source: t.source,
      status: t.status,
      confirmed_at: t.confirmed_at,
      confirmed_by_user_id: t.confirmed_by_user_id,
      created_at: typeof t.created_at === "string" ? t.created_at : new Date(t.created_at).toISOString(),
      updated_at: typeof t.updated_at === "string" ? t.updated_at : new Date(t.updated_at).toISOString(),
      account: t.acc_id ? { id: t.acc_id, name: t.acc_name } : null,
      category: t.cat_id ? { id: t.cat_id, name: t.cat_name } : null,
      created_by_user: null,
    }));

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
    const rawCategoryId = body.category_id != null ? parseInt(String(body.category_id), 10) : NaN;
    const type = typeof body.type === "string" ? body.type : "";
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0));
    const currency = (typeof body.currency === "string" && body.currency.length === 3) ? body.currency : "BRL";
    const date = typeof body.date === "string" ? body.date : "";
    const description = typeof body.description === "string" ? body.description : null;
    const status = (body.status === "draft" || body.status === "confirmed" ? body.status : "confirmed") as string;

    const isIncome = type === "income";
    const categoryId = !Number.isNaN(rawCategoryId) ? rawCategoryId : null;

    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ message: "type must be income or expense." }, { status: 422 });
    }
    if (!isIncome && categoryId == null) {
      return NextResponse.json({ message: "category_id is required for expenses." }, { status: 422 });
    }
    if (Number.isNaN(amount)) {
      return NextResponse.json({ message: "amount is required." }, { status: 422 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: "date is required and must be YYYY-MM-DD." }, { status: 422 });
    }

    if (categoryId != null) {
      const category = await fetchOne<{ id: number }>(
        "SELECT id FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
        [categoryId, wid]
      );
      if (!category) {
        return NextResponse.json({ message: "Category not found." }, { status: 422 });
      }
    }

    const id = await createTransaction({
      workspaceId: wid,
      accountId: null,
      categoryId,
      createdByUserId: user.id,
      type,
      amount,
      currency,
      exchangeRate: 1,
      baseAmount: amount,
      date,
      description: description ?? undefined,
      source: "web_manual",
      status,
    });

    const t = await findTransactionById(id, wid);
    if (!t) {
      return NextResponse.json({ message: "Transaction created but could not fetch." }, { status: 500 });
    }

    const row = t as any;
    return NextResponse.json(
      {
        data: {
          id: row.id,
          workspace_id: row.workspace_id,
          account_id: row.account_id,
          category_id: row.category_id,
          created_by_user_id: row.created_by_user_id,
          type: row.type,
          amount: Number(row.amount),
          currency: row.currency,
          exchange_rate: Number(row.exchange_rate ?? 1),
          base_amount: Number(row.base_amount ?? row.amount),
          date: typeof row.date === "string" ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10),
          description: row.description,
          source: row.source,
          status: row.status,
          account: row.acc_id ? { id: row.acc_id, name: row.acc_name } : null,
          category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
        },
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/transactions error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
