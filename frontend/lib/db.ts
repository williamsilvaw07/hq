import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getConnectionConfig(): string | mysql.PoolOptions {
  const url = process.env.DATABASE_URL;
  if (url) {
    return url;
  }
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  if (host && user && database) {
    return {
      host,
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user,
      password: process.env.DB_PASSWORD || "",
      database,
    };
  }
  throw new Error(
    "Set either DATABASE_URL or all of DB_HOST, DB_USER, and DB_NAME (optionally DB_PORT, DB_PASSWORD)"
  );
}

export function getPool() {
  if (!pool) {
    const config = getConnectionConfig();
    pool = typeof config === "string" ? mysql.createPool(config) : mysql.createPool(config);
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

