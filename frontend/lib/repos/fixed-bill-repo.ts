import { fetchMany, fetchOne, insertOne, execute } from "@/lib/sql";
import type { ResultSetHeader } from "mysql2";

export type FixedBillRow = {
  id: number;
  workspace_id: number;
  name: string;
  category: string;
  amount: number;
  icon: string | null;
  due: string;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  end_date: string | null;
};

export async function findFixedBillsByWorkspace(workspaceId: number): Promise<FixedBillRow[]> {
  const rows = await fetchMany<FixedBillRow>(
    `SELECT id, workspace_id, name, category, amount, icon, due, frequency, day_of_month, day_of_week, end_date
     FROM FixedBill
     WHERE workspace_id = ?
     ORDER BY name ASC`,
    [workspaceId]
  );
  return rows;
}

export async function findFixedBillById(id: number, workspaceId: number): Promise<FixedBillRow | null> {
  return fetchOne<FixedBillRow>(
    `SELECT id, workspace_id, name, category, amount, icon, due, frequency, day_of_month, day_of_week, end_date
     FROM FixedBill
     WHERE id = ? AND workspace_id = ?
     LIMIT 1`,
    [id, workspaceId]
  );
}

function formatDueForDb(due: string): string {
  const trimmed = String(due ?? "").trim();
  if (!trimmed) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export async function createFixedBill(data: {
  workspaceId: number;
  name: string;
  category: string;
  amount: number;
  icon?: string | null;
  due: string;
  frequency: "monthly" | "weekly";
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  endDate: string | null;
}): Promise<number> {
  const dueStr = formatDueForDb(data.due);
  const endStr = data.endDate ? formatDueForDb(data.endDate) : null;
  const icon = data.icon && data.icon.trim() ? data.icon.trim() : null;

  const id = await insertOne(
    `INSERT INTO FixedBill (workspace_id, name, category, amount, icon, due, frequency, day_of_month, day_of_week, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.workspaceId,
      data.name,
      data.category,
      data.amount,
      icon,
      dueStr,
      data.frequency,
      data.dayOfMonth,
      data.dayOfWeek,
      endStr,
    ]
  );
  return id;
}

export async function updateFixedBill(
  id: number,
  workspaceId: number,
  data: {
    name?: string;
    category?: string;
    amount?: number;
    icon?: string | null;
    due?: string;
    frequency?: "monthly" | "weekly";
    dayOfMonth?: number | null;
    dayOfWeek?: number | null;
    endDate?: string | null;
  }
): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    params.push(data.name);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    params.push(data.category);
  }
  if (data.amount !== undefined) {
    fields.push("amount = ?");
    params.push(data.amount);
  }
  if (data.icon !== undefined) {
    fields.push("icon = ?");
    params.push(data.icon && data.icon.trim() ? data.icon.trim() : null);
  }
  if (data.due !== undefined) {
    fields.push("due = ?");
    params.push(formatDueForDb(data.due));
  }
  if (data.frequency !== undefined) {
    fields.push("frequency = ?");
    params.push(data.frequency);
  }
  if (data.dayOfMonth !== undefined) {
    fields.push("day_of_month = ?");
    params.push(data.dayOfMonth);
  }
  if (data.dayOfWeek !== undefined) {
    fields.push("day_of_week = ?");
    params.push(data.dayOfWeek);
  }
  if (data.endDate !== undefined) {
    fields.push("end_date = ?");
    params.push(data.endDate ? formatDueForDb(data.endDate) : null);
  }

  if (fields.length === 0) return;
  params.push(id, workspaceId);
  await execute(
    `UPDATE FixedBill SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ? AND workspace_id = ?`,
    params
  );
}

export async function deleteFixedBill(id: number, workspaceId: number): Promise<void> {
  await execute("DELETE FROM FixedBill WHERE id = ? AND workspace_id = ?", [id, workspaceId]);
}
