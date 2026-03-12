import { getPool, query, queryOne } from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function fetchOne<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T | null> {
  return queryOne<T>(sql, params);
}

export async function fetchMany<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  return query<T>(sql, params);
}

export async function insertOne(
  sql: string,
  params: any[] = [],
): Promise<number> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(sql, params);
  return res.insertId;
}

export async function execute(
  sql: string,
  params: any[] = [],
): Promise<void> {
  const pool = getPool();
  await pool.query<RowDataPacket[]>(sql, params);
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
};

export async function paginate<T = any>(
  baseSql: string,
  countSql: string,
  params: any[],
  page: number,
  perPage: number,
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * perPage;
  const data = await fetchMany<T>(`${baseSql} LIMIT ? OFFSET ?`, [
    ...params,
    perPage,
    offset,
  ]);
  const countRows = await fetchMany<{ total: number }>(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const last_page = Math.max(1, Math.ceil(total / perPage));
  return { data, total, current_page: page, per_page: perPage, last_page };
}

