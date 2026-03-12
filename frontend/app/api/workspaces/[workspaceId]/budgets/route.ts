import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { getCurrentPeriod } from "@/lib/budget-period";
import { fetchMany, fetchOne, insertOne } from "@/lib/sql";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const url = new URL(req.url);
    const withSummaries = url.searchParams.get("with_summaries") === "true";
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    if (withSummaries) {
      const budgets = await fetchMany<{
        id: number;
        workspaceId: number;
        categoryId: number;
        month: number;
        year: number;
        periodType: string;
        periodInterval: number;
        startDate: Date | null;
        amount: number;
        currency: string;
        categoryIdNullable: number | null;
        categoryName: string | null;
        categoryIcon: string | null;
        categoryColor: string | null;
      }>(
        `SELECT
           b.id,
           b.workspace_id AS workspaceId,
           b.category_id AS categoryId,
           b.month,
           b.year,
           b.period_type AS periodType,
           b.period_interval AS periodInterval,
           b.start_date AS startDate,
           b.amount,
           b.currency,
           c.id AS categoryIdNullable,
           c.name AS categoryName,
           c.icon AS categoryIcon,
           c.color AS categoryColor
         FROM budgets b
         LEFT JOIN Category c ON c.id = b.category_id
         WHERE b.workspace_id = ?`,
        [wid],
      );

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

          const spentRow = await fetchOne<{ spent: number }>(
            `SELECT COALESCE(SUM(base_amount), 0) AS spent
             FROM Transaction
             WHERE workspace_id = ?
               AND status = 'confirmed'
               AND type = 'expense'
               AND category_id = ?
               AND date BETWEEN ? AND ?`,
            [wid, budget.categoryId, startStr, endStr],
          );
          const spent = Number(spentRow?.spent ?? 0);
          const amount = Number(budget.amount ?? 0);
          const remaining = Math.max(0, amount - spent);
          const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;

          return {
            id: budget.id,
            category: budget.categoryIdNullable
              ? {
                  id: budget.categoryIdNullable,
                  name: budget.categoryName,
                  icon: budget.categoryIcon,
                  color: budget.categoryColor,
                }
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
        }),
      );
      return NextResponse.json({ data: result });
    }

    const paramsArr: any[] = [wid];
    let filterSql = "";
    if (month) {
      filterSql += " AND b.month = ?";
      paramsArr.push(parseInt(month, 10));
    }
    if (year) {
      filterSql += " AND b.year = ?";
      paramsArr.push(parseInt(year, 10));
    }

    const budgets = await fetchMany(
      `SELECT
         b.id,
         b.workspace_id AS workspaceId,
         b.category_id AS categoryId,
         b.month,
         b.year,
         b.period_type AS periodType,
         b.period_interval AS periodInterval,
         b.start_date AS startDate,
         b.amount,
         b.currency,
         c.id AS categoryIdNullable,
         c.name AS categoryName,
         c.icon AS categoryIcon,
         c.color AS categoryColor
       FROM budgets b
       LEFT JOIN Category c ON c.id = b.category_id
       WHERE b.workspace_id = ?${filterSql}
       ORDER BY b.month ASC, b.year ASC`,
      paramsArr,
    );
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

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "697a2b",
      },
      body: JSON.stringify({
        sessionId: "697a2b",
        runId: "pre-insert",
        hypothesisId: "A",
        location: "app/api/workspaces/[workspaceId]/budgets/route.ts:POST:body",
        message: "Budget POST body received",
        data: {
          workspaceIdParam: workspaceId,
          wid,
          category_id: body.category_id,
          month: body.month,
          year: body.year,
          period_type: body.period_type,
          period_interval: body.period_interval,
          amount: body.amount,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1e4b05",
      },
      body: JSON.stringify({
        sessionId: "1e4b05",
        runId: "run1",
        hypothesisId: "H1",
        location: "app/api/workspaces/[workspaceId]/budgets/route.ts:POST:body",
        message: "Budget POST body received (current session)",
        data: {
          workspaceIdParam: workspaceId,
          wid,
          category_id: body.category_id,
          month: body.month,
          year: body.year,
          period_type: body.period_type,
          period_interval: body.period_interval,
          amount: body.amount,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const categoryId = body.category_id != null ? parseInt(String(body.category_id), 10) : NaN;
    const month = body.month != null ? parseInt(String(body.month), 10) : NaN;
    const year = body.year != null ? parseInt(String(body.year), 10) : NaN;
    const periodType = (typeof body.period_type === "string" ? body.period_type : "month") as string;
    const periodInterval = body.period_interval != null ? Math.min(12, Math.max(1, parseInt(String(body.period_interval), 10))) : 1;
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0));
    const currency =
      typeof body.currency === "string" && body.currency.length === 3
        ? body.currency
        : "BRL";

    if (Number.isNaN(categoryId) || Number.isNaN(month) || Number.isNaN(year)) {
      return NextResponse.json(
        { message: "category_id, month and year are required." },
        { status: 422 },
      );
    }
    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return NextResponse.json(
        { message: "Invalid month or year." },
        { status: 422 },
      );
    }
    if (amount < 0 || Number.isNaN(amount)) {
      return NextResponse.json(
        { message: "Amount must be a non-negative number." },
        { status: 422 },
      );
    }
    if (!["day", "week", "month", "year"].includes(periodType)) {
      return NextResponse.json(
        { message: "Invalid period_type." },
        { status: 422 },
      );
    }

    const category = await fetchOne<{ id: number }>(
      "SELECT id FROM Category WHERE id = ? AND workspace_id = ? LIMIT 1",
      [categoryId, wid],
    );
    if (!category) {
      return NextResponse.json(
        { message: "Category not found." },
        { status: 422 },
      );
    }

    // Ensure we don't create duplicate budgets for same workspace/category/month/year
    const existing = await fetchOne<{ id: number }>(
      `SELECT id
       FROM budgets
       WHERE workspace_id = ?
         AND category_id = ?
         AND month = ?
         AND year = ?
       LIMIT 1`,
      [wid, categoryId, month, year],
    );
    if (existing) {
      return NextResponse.json(
        { message: "A budget for this category and month already exists." },
        { status: 422 },
      );
    }

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "697a2b",
      },
      body: JSON.stringify({
        sessionId: "697a2b",
        runId: "pre-insert",
        hypothesisId: "B",
        location: "app/api/workspaces/[workspaceId]/budgets/route.ts:POST:before-insert",
        message: "About to insert budget",
        data: {
          wid,
          categoryId,
          month,
          year,
          periodType,
          periodInterval,
          amount,
          currency,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const id = await insertOne(
      `INSERT INTO budgets
         (workspace_id, category_id, month, year, period_type, period_interval, start_date, amount, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NOW(3), NOW(3))`,
      [wid, categoryId, month, year, periodType, periodInterval, amount, currency],
    );

    const [budget] = await fetchMany(
      `SELECT
         b.id,
         b.workspace_id AS workspaceId,
         b.category_id AS categoryId,
         b.month,
         b.year,
         b.period_type AS periodType,
         b.period_interval AS periodInterval,
         b.start_date AS startDate,
         b.amount,
         b.currency,
         c.id AS categoryIdNullable,
         c.name AS categoryName,
         c.icon AS categoryIcon,
         c.color AS categoryColor
       FROM budgets b
       LEFT JOIN Category c ON c.id = b.category_id
       WHERE b.id = ?
       LIMIT 1`,
      [id],
    );

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/budgets error:", e);

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "697a2b",
      },
      body: JSON.stringify({
        sessionId: "697a2b",
        runId: "error",
        hypothesisId: "C",
        location: "app/api/workspaces/[workspaceId]/budgets/route.ts:POST:catch",
        message: "Budget POST threw error",
        data: {
          workspaceIdParam: (await params).workspaceId,
          errorMessage: (e as Error).message,
          name: (e as Error).name,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1e4b05",
      },
      body: JSON.stringify({
        sessionId: "1e4b05",
        runId: "run1",
        hypothesisId: "H2",
        location: "app/api/workspaces/[workspaceId]/budgets/route.ts:POST:catch",
        message: "Budget POST threw error (current session)",
        data: {
          workspaceIdParam: (await params).workspaceId,
          errorMessage: (e as Error).message,
          name: (e as Error).name,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    return NextResponse.json(
      { message: (e as Error).message || "Request failed." },
      { status: 500 },
    );
  }
}
