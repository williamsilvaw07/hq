import { fetchMany, fetchOne, insertOne, execute } from "@/lib/sql";
import type { ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";

export type TransactionRow = {
  id: number;
  workspace_id: number;
  account_id: number | null;
  category_id: number | null;
  created_by_user_id: number | null;
  type: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  date: string;
  description: string | null;
  source: string;
  status: string;
  confirmed_at: string | null;
  confirmed_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export async function countTransactions(where: {
  workspaceId: number;
  status?: string;
  type?: string;
  categoryId?: number;
  accountId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<number> {
  const { conditions, params } = buildWhereClause(where, "Transaction");
  const row = await fetchOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Transaction WHERE ${conditions}`,
    params
  );
  return row?.total ?? 0;
}

export async function findTransactions(
  where: {
    workspaceId: number;
    status?: string;
    type?: string;
    categoryId?: number;
    accountId?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  },
  opts: { orderBy?: string; limit?: number; offset?: number } = {}
): Promise<TransactionRow[]> {
  const { conditions, params } = buildWhereClause(where, "t");
  let sql = `SELECT t.*, c.id AS cat_id, c.name AS cat_name, a.id AS acc_id, a.name AS acc_name
    FROM Transaction t
    LEFT JOIN Category c ON c.id = t.category_id
    LEFT JOIN Account a ON a.id = t.account_id
    WHERE ${conditions}`;
  sql += opts.orderBy ? ` ORDER BY ${opts.orderBy}` : " ORDER BY t.date DESC, t.id DESC";
  if (opts.limit != null) {
    params.push(opts.limit);
    sql += " LIMIT ?";
  }
  if (opts.offset != null) {
    params.push(opts.offset);
    sql += " OFFSET ?";
  }
  return fetchMany<TransactionRow & { cat_id?: number; cat_name?: string; acc_id?: number; acc_name?: string }>(sql, params);
}

function buildWhereClause(
  where: {
    workspaceId: number;
    status?: string;
    type?: string;
    categoryId?: number;
    accountId?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  },
  prefix: string
): { conditions: string; params: any[] } {
  const p = prefix ? `${prefix}.` : "";
  const conditions: string[] = [`${p}workspace_id = ?`];
  const params: any[] = [where.workspaceId];
  if (where.status) {
    conditions.push(`${p}status = ?`);
    params.push(where.status);
  } else {
    // Exclude temporary telegram confirmations from general queries
    conditions.push(`${p}status != 'pending_confirmation'`);
  }
  if (where.type) {
    conditions.push(`${p}type = ?`);
    params.push(where.type);
  }
  if (where.categoryId != null) {
    conditions.push(`${p}category_id = ?`);
    params.push(where.categoryId);
  }
  if (where.accountId != null) {
    conditions.push(`${p}account_id = ?`);
    params.push(where.accountId);
  }
  if (where.dateFrom) {
    conditions.push(`${p}date >= ?`);
    params.push(where.dateFrom);
  }
  if (where.dateTo) {
    conditions.push(`${p}date <= ?`);
    params.push(where.dateTo);
  }
  if (where.search) {
    conditions.push(`${p}description LIKE ?`);
    params.push(`%${where.search}%`);
  }
  return { conditions: conditions.join(" AND "), params };
}

export async function findTransactionById(id: number, workspaceId: number): Promise<(TransactionRow & { cat_id?: number; cat_name?: string; acc_id?: number; acc_name?: string }) | null> {
  const row = await fetchOne<any>(
    `SELECT t.*, c.id AS cat_id, c.name AS cat_name, a.id AS acc_id, a.name AS acc_name
     FROM Transaction t
     LEFT JOIN Category c ON c.id = t.category_id
     LEFT JOIN Account a ON a.id = t.account_id
     WHERE t.id = ? AND t.workspace_id = ?
     LIMIT 1`,
    [id, workspaceId]
  );
  return row;
}

export async function createTransaction(data: {
  workspaceId: number;
  accountId?: number | null;
  categoryId?: number | null;
  createdByUserId?: number | null;
  type: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
  date: string;
  description?: string | null;
  source?: string;
  status?: string;
}): Promise<number> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO Transaction (workspace_id, account_id, category_id, created_by_user_id, type, amount, currency, exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      data.workspaceId,
      data.accountId ?? null,
      data.categoryId ?? null,
      data.createdByUserId ?? null,
      data.type,
      data.amount,
      data.currency,
      data.exchangeRate ?? 1,
      data.baseAmount ?? data.amount,
      data.date,
      data.description ?? null,
      data.source ?? "web_manual",
      data.status ?? "confirmed",
    ]
  );
  return res.insertId;
}

export async function updateTransaction(
  id: number,
  data: {
    categoryId?: number;
    type?: string;
    amount?: number;
    currency?: string;
    date?: string;
    description?: string | null;
    status?: string;
    confirmedAt?: Date | null;
    confirmedByUserId?: number | null;
  }
): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];
  if (data.categoryId !== undefined) {
    fields.push("category_id = ?");
    params.push(data.categoryId);
  }
  if (data.type !== undefined) {
    fields.push("type = ?");
    params.push(data.type);
  }
  if (data.amount !== undefined) {
    fields.push("amount = ?");
    fields.push("base_amount = ?");
    params.push(data.amount, data.amount);
  }
  if (data.currency !== undefined) {
    fields.push("currency = ?");
    params.push(data.currency);
  }
  if (data.date !== undefined) {
    fields.push("date = ?");
    params.push(data.date);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    params.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.confirmedAt !== undefined) {
    fields.push("confirmed_at = ?");
    params.push(data.confirmedAt);
  }
  if (data.confirmedByUserId !== undefined) {
    fields.push("confirmed_by_user_id = ?");
    params.push(data.confirmedByUserId);
  }
  if (fields.length === 0) return;
  fields.push("updated_at = NOW(3)");
  params.push(id);
  await execute(`UPDATE Transaction SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function deleteTransaction(id: number): Promise<void> {
  await execute("DELETE FROM Transaction WHERE id = ?", [id]);
}

export async function aggregateTransactions(
  workspaceId: number,
  type: "income" | "expense",
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const row = await fetchOne<{ sum: number }>(
    `SELECT COALESCE(SUM(base_amount), 0) AS sum
     FROM Transaction
     WHERE workspace_id = ? AND status = 'confirmed' AND type = ? AND date BETWEEN ? AND ?`,
    [workspaceId, type, dateFrom, dateTo]
  );
  return Number(row?.sum ?? 0);
}
