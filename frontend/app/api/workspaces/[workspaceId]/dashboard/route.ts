import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany } from "@/lib/sql";
import { aggregateTransactions } from "@/lib/repos/transaction-repo";

const PERIODS = ["today", "this_week", "last_week", "this_month"] as const;

function dateRangeForPeriod(period: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    case "this_week": {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case "last_week": {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case "this_month":
    default: {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const periodParam = new URL(req.url).searchParams.get("period");
    const period = periodParam && PERIODS.includes(periodParam as (typeof PERIODS)[number])
      ? (periodParam as (typeof PERIODS)[number])
      : "this_month";
    const { start, end } = dateRangeForPeriod(period);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const [periodIncomeVal, periodExpenseVal, recentRows] = await Promise.all([
      aggregateTransactions(wid, "income", startStr, endStr),
      aggregateTransactions(wid, "expense", startStr, endStr),
      fetchMany<{
        id: number;
        type: string;
        amount: number;
        currency: string;
        date: string;
        description: string | null;
        status: string;
        cat_id: number | null;
        cat_name: string | null;
      }>(
        `SELECT t.id, t.type, t.amount, t.currency, t.date, t.description, t.status, c.id AS cat_id, c.name AS cat_name
         FROM Transaction t
         LEFT JOIN Category c ON c.id = t.category_id
         WHERE t.workspace_id = ? AND t.date BETWEEN ? AND ?
         ORDER BY t.date DESC, t.id DESC
         LIMIT 10`,
        [wid, startStr, endStr]
      ),
    ]);

    const recent_transactions = recentRows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
      description: t.description,
      status: t.status,
      category: t.cat_id ? { id: t.cat_id, name: t.cat_name } : null,
    }));

    return NextResponse.json({
      data: {
        period,
        period_income: periodIncomeVal,
        period_expense: periodExpenseVal,
        recent_transactions,
      },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/dashboard error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
