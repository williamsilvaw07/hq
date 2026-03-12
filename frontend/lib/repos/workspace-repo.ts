import { getPool, query, queryOne } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

export type DbWorkspace = {
  id: number;
  name: string;
  slug: string;
};

export async function listWorkspacesForUser(userId: number): Promise<DbWorkspace[]> {
  return await query<DbWorkspace>(
    `SELECT w.id, w.name, w.slug
     FROM Workspace w
     JOIN workspace_users wu ON wu.workspace_id = w.id
     WHERE wu.user_id = ?
     ORDER BY w.name`,
    [userId]
  );
}

export async function createWorkspaceForUser(
  userId: number,
  name: string,
  slugInput?: string | null,
): Promise<DbWorkspace> {
  const pool = getPool();
  const base =
    slugInput ||
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
    "workspace";
  let slug = base;
  let n = 1;
  while (await queryOne<DbWorkspace>("SELECT id, name, slug FROM Workspace WHERE slug = ? LIMIT 1", [slug])) {
    slug = `${base}-${n++}`;
  }

  const [wsRes] = await pool.query<ResultSetHeader>(
    "INSERT INTO Workspace (name, slug, created_at, updated_at) VALUES (?, ?, NOW(3), NOW(3))",
    [name, slug]
  );
  const workspaceId = wsRes.insertId;

  await pool.query(
    "INSERT INTO workspace_users (workspace_id, user_id, role, created_at, updated_at) VALUES (?, ?, 'owner', NOW(3), NOW(3))",
    [workspaceId, userId]
  );

  const ws = await queryOne<DbWorkspace>(
    "SELECT id, name, slug FROM Workspace WHERE id = ?",
    [workspaceId]
  );
  if (!ws) throw new Error("Workspace not found after insert");
  return ws;
}

