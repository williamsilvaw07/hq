import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany } from "@/lib/sql";

type MonthRow = {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  transaction_count: number;
};

type CategoryRow = {
  category_name: string;
  category_icon: string | null;
  total: number;
};

type TransactionRow = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  status: string;
  cat_id: number | null;
  cat_name: string | null;
};

type FixedBillRow = {
  id: number;
  name: string;
  amount: number;
  icon: string | null;
  day_of_month: number | null;
};

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const searchParams = new URL(req.url).searchParams;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    // Month detail view
    if (yearParam && monthParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json({ message: "Invalid year or month." }, { status: 400 });
      }

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

      // Summary
      const [summary] = await fetchMany<MonthRow>(
        `SELECT
           YEAR(t.date) AS year,
           MONTH(t.date) AS month,
           COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses,
           COUNT(*) AS transaction_count
         FROM Transaction t
         WHERE t.workspace_id = ?
           AND t.status IN ('confirmed', 'draft')
           AND t.date >= ? AND t.date < ?
         GROUP BY YEAR(t.date), MONTH(t.date)`,
        [wid, startDate, endDate],
      );

      const totalIncome = summary ? Number(summary.total_income) : 0;
      const totalExpenses = summary ? Number(summary.total_expenses) : 0;
      const transactionCount = summary ? Number(summary.transaction_count) : 0;

      // Category breakdown
      const categories = await fetchMany<CategoryRow>(
        `SELECT
           COALESCE(c.name, 'Uncategorized') AS category_name,
           c.icon AS category_icon,
           SUM(t.amount) AS total
         FROM Transaction t
         LEFT JOIN Category c ON c.id = t.category_id
         WHERE t.workspace_id = ?
           AND t.type = 'expense'
           AND t.status IN ('confirmed', 'draft')
           AND t.date >= ? AND t.date < ?
         GROUP BY c.id, c.name, c.icon
         ORDER BY total DESC`,
        [wid, startDate, endDate],
      );

      // Fixed bills for this month
      const fixedBills = await fetchMany<FixedBillRow>(
        `SELECT id, name, amount, icon, day_of_month
         FROM fixed_bills
         WHERE workspace_id = ?
         ORDER BY day_of_month ASC, name ASC`,
        [wid],
      );

      // Transactions for this month
      const transactions = await fetchMany<TransactionRow>(
        `SELECT t.id, t.type, t.amount, t.currency, t.date, t.description, t.status,
                c.id AS cat_id, c.name AS cat_name
         FROM Transaction t
         LEFT JOIN Category c ON c.id = t.category_id
         WHERE t.workspace_id = ?
           AND t.status IN ('confirmed', 'draft')
           AND t.date >= ? AND t.date < ?
         ORDER BY t.date DESC, t.id DESC`,
        [wid, startDate, endDate],
      );

      return NextResponse.json({
        data: {
          year,
          month,
          label: `${MONTH_LABELS[month - 1]} ${year}`,
          totalIncome,
          totalExpenses,
          netResult: totalIncome - totalExpenses,
          transactionCount,
          fixedBillsTotal: fixedBills.reduce((s, b) => s + Number(b.amount), 0),
          categories: categories.map((c) => ({
            name: c.category_name,
            icon: c.category_icon,
            total: Number(c.total),
          })),
          fixedBills: fixedBills.map((b) => ({
            id: b.id,
            name: b.name,
            amount: Number(b.amount),
            icon: b.icon,
            dayOfMonth: b.day_of_month,
          })),
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            currency: t.currency,
            date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
            description: t.description,
            status: t.status,
            category: t.cat_id ? { id: t.cat_id, name: t.cat_name } : null,
          })),
        },
      });
    }

    // Year overview — month summaries for a given year (or all available years)
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        return NextResponse.json({ message: "Invalid year." }, { status: 400 });
      }

      const months = await fetchMany<MonthRow>(
        `SELECT
           YEAR(t.date) AS year,
           MONTH(t.date) AS month,
           COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses,
           COUNT(*) AS transaction_count
         FROM Transaction t
         WHERE t.workspace_id = ?
           AND t.status IN ('confirmed', 'draft')
           AND YEAR(t.date) = ?
         GROUP BY YEAR(t.date), MONTH(t.date)
         ORDER BY MONTH(t.date) ASC`,
        [wid, year],
      );

      // Top categories per month (top 3)
      const topCats = await fetchMany<{ month: number; category_name: string; category_icon: string | null; total: number }>(
        `SELECT
           MONTH(t.date) AS month,
           COALESCE(c.name, 'Uncategorized') AS category_name,
           c.icon AS category_icon,
           SUM(t.amount) AS total
         FROM Transaction t
         LEFT JOIN Category c ON c.id = t.category_id
         WHERE t.workspace_id = ?
           AND t.type = 'expense'
           AND t.status IN ('confirmed', 'draft')
           AND YEAR(t.date) = ?
         GROUP BY MONTH(t.date), c.id, c.name, c.icon
         ORDER BY MONTH(t.date) ASC, total DESC`,
        [wid, year],
      );

      // Group top cats by month (max 3 per month)
      const catsByMonth: Record<number, { name: string; icon: string | null; total: number }[]> = {};
      for (const row of topCats) {
        const m = row.month;
        if (!catsByMonth[m]) catsByMonth[m] = [];
        if (catsByMonth[m].length < 3) {
          catsByMonth[m].push({ name: row.category_name, icon: row.category_icon, total: Number(row.total) });
        }
      }

      // Fixed bills total
      const fixedBills = await fetchMany<{ amount: number }>(
        `SELECT amount FROM fixed_bills WHERE workspace_id = ?`,
        [wid],
      );
      const fixedTotal = fixedBills.reduce((s, b) => s + Number(b.amount), 0);

      const summaries = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const row = months.find((r) => r.month === m);
        const income = row ? Number(row.total_income) : 0;
        const expenses = row ? Number(row.total_expenses) : 0;
        return {
          year,
          month: m,
          label: `${MONTH_LABELS[i]} ${year}`,
          totalIncome: income,
          totalExpenses: expenses,
          netResult: income - expenses,
          fixedBillsTotal: fixedTotal,
          transactionCount: row ? Number(row.transaction_count) : 0,
          topCategories: catsByMonth[m] ?? [],
        };
      });

      return NextResponse.json({ data: { year, months: summaries } });
    }

    // Default: list available years
    const years = await fetchMany<{ year: number; total_income: number; total_expenses: number; transaction_count: number }>(
      `SELECT
         YEAR(t.date) AS year,
         COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses,
         COUNT(*) AS transaction_count
       FROM Transaction t
       WHERE t.workspace_id = ?
         AND t.status IN ('confirmed', 'draft')
       GROUP BY YEAR(t.date)
       ORDER BY year DESC`,
      [wid],
    );

    return NextResponse.json({
      data: {
        years: years.map((y) => ({
          year: y.year,
          totalIncome: Number(y.total_income),
          totalExpenses: Number(y.total_expenses),
          transactionCount: Number(y.transaction_count),
        })),
      },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/history error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
