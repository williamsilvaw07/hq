import { fetchMany, fetchOne, insertOne, execute } from "@/lib/sql";
import type { ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";

export type InvitationRow = {
  id: number;
  workspace_id: number;
  email: string;
  role: string;
  token: string;
  invited_by: number;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function findInvitationByToken(token: string): Promise<(InvitationRow & { workspace_name?: string }) | null> {
  const rows = await fetchMany<InvitationRow & { workspace_name?: string }>(
    `SELECT i.*, w.name AS workspace_name
     FROM workspace_invitations i
     JOIN Workspace w ON w.id = i.workspace_id
     WHERE i.token = ? AND i.accepted_at IS NULL AND i.expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows[0] ?? null;
}

export async function findWorkspaceMember(workspaceId: number, userId: number): Promise<{ id: number } | null> {
  return fetchOne<{ id: number }>(
    "SELECT id FROM workspace_users WHERE workspace_id = ? AND user_id = ? LIMIT 1",
    [workspaceId, userId]
  );
}

export async function createWorkspaceMember(workspaceId: number, userId: number, role: string): Promise<number> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO workspace_users (workspace_id, user_id, role, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
    [workspaceId, userId, role]
  );
  return res.insertId;
}

export async function updateInvitationAccepted(id: number): Promise<void> {
  await execute(
    "UPDATE workspace_invitations SET accepted_at = NOW(3), updated_at = NOW(3) WHERE id = ?",
    [id]
  );
}

export async function createInvitation(data: {
  workspaceId: number;
  email: string;
  role: string;
  token: string;
  invitedBy: number;
  expiresAt: Date;
}): Promise<number> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO workspace_invitations (workspace_id, email, role, token, invited_by, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [data.workspaceId, data.email, data.role, data.token, data.invitedBy, data.expiresAt]
  );
  return res.insertId;
}

export async function findPendingInvitation(workspaceId: number, email: string): Promise<InvitationRow | null> {
  return fetchOne<InvitationRow>(
    "SELECT * FROM workspace_invitations WHERE workspace_id = ? AND email = ? AND accepted_at IS NULL AND expires_at > NOW() LIMIT 1",
    [workspaceId, email]
  );
}

export async function deleteInvitation(id: number, workspaceId: number): Promise<number> {
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    "DELETE FROM workspace_invitations WHERE id = ? AND workspace_id = ? AND accepted_at IS NULL",
    [id, workspaceId]
  );
  return res.affectedRows;
}

export async function listInvitations(workspaceId: number): Promise<(InvitationRow & { inviter_name?: string; inviter_email?: string })[]> {
  return fetchMany(
    `SELECT i.*, u.name AS inviter_name, u.email AS inviter_email
     FROM workspace_invitations i
     JOIN User u ON u.id = i.invited_by
     WHERE i.workspace_id = ? AND i.accepted_at IS NULL AND i.expires_at > NOW()
     ORDER BY i.created_at DESC`,
    [workspaceId]
  );
}
