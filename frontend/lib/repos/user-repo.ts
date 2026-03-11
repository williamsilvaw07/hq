import { getPool, query, queryOne } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

export type DbUser = {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  password: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return await queryOne<DbUser>(
    "SELECT id, name, email, avatar_url, password FROM User WHERE email = ? LIMIT 1",
    [email]
  );
}

export async function findUserById(id: number): Promise<DbUser | null> {
  return await queryOne<DbUser>(
    "SELECT id, name, email, avatar_url, password FROM User WHERE id = ? LIMIT 1",
    [id]
  );
}

export async function createUser(args: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<DbUser> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO User (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
    [args.name, args.email, args.passwordHash]
  );
  const id = res.insertId;
  const user = await findUserById(id);
  if (!user) throw new Error("Failed to load user after insert");
  return user;
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; email?: string; avatar_url?: string | null }
) {
  const fields: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) {
    fields.push("name = ?");
    params.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    params.push(data.email);
  }
  if (data.avatar_url !== undefined) {
    fields.push("avatar_url = ?");
    params.push(data.avatar_url);
  }
  if (!fields.length) return;
  params.push(id);
  await query(
    `UPDATE User SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ?`,
    params
  );
}

