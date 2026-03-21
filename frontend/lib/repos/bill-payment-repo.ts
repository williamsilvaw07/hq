import { fetchMany, fetchOne, insertOne, execute } from "@/lib/sql";

export type BillPaymentRow = {
  id: number;
  fixed_bill_id: number;
  workspace_id: number;
  paid_by_user_id: number | null;
  amount: number;
  paid_at: string;
  period_month: number;
  period_year: number;
  proof_url: string | null;
  proof_filename: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

export type BillPaymentWithUser = BillPaymentRow & {
  paid_by_name: string | null;
};

export async function findPaymentsByBill(
  fixedBillId: number,
  workspaceId: number,
): Promise<BillPaymentWithUser[]> {
  return fetchMany<BillPaymentWithUser>(
    `SELECT bp.*, u.name AS paid_by_name
     FROM BillPayment bp
     LEFT JOIN User u ON u.id = bp.paid_by_user_id
     WHERE bp.fixed_bill_id = ? AND bp.workspace_id = ?
     ORDER BY bp.period_year DESC, bp.period_month DESC, bp.paid_at DESC`,
    [fixedBillId, workspaceId],
  );
}

export async function findPaymentsByWorkspaceMonth(
  workspaceId: number,
  month: number,
  year: number,
): Promise<BillPaymentRow[]> {
  return fetchMany<BillPaymentRow>(
    `SELECT * FROM BillPayment
     WHERE workspace_id = ? AND period_month = ? AND period_year = ?
     ORDER BY paid_at DESC`,
    [workspaceId, month, year],
  );
}

export async function findPaymentById(
  id: number,
  workspaceId: number,
): Promise<BillPaymentRow | null> {
  return fetchOne<BillPaymentRow>(
    `SELECT * FROM BillPayment WHERE id = ? AND workspace_id = ? LIMIT 1`,
    [id, workspaceId],
  );
}

export async function createBillPayment(data: {
  fixedBillId: number;
  workspaceId: number;
  paidByUserId: number | null;
  amount: number;
  paidAt: string;
  periodMonth: number;
  periodYear: number;
  proofUrl?: string | null;
  proofFilename?: string | null;
  notes?: string | null;
  source?: string;
}): Promise<number> {
  return insertOne(
    `INSERT INTO BillPayment
       (fixed_bill_id, workspace_id, paid_by_user_id, amount, paid_at, period_month, period_year, proof_url, proof_filename, notes, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fixedBillId,
      data.workspaceId,
      data.paidByUserId,
      data.amount,
      data.paidAt,
      data.periodMonth,
      data.periodYear,
      data.proofUrl ?? null,
      data.proofFilename ?? null,
      data.notes ?? null,
      data.source ?? "web",
    ],
  );
}

export async function updateBillPaymentProof(
  id: number,
  workspaceId: number,
  proofUrl: string,
  proofFilename: string,
): Promise<void> {
  await execute(
    `UPDATE BillPayment SET proof_url = ?, proof_filename = ?, updated_at = NOW(3) WHERE id = ? AND workspace_id = ?`,
    [proofUrl, proofFilename, id, workspaceId],
  );
}

export async function updateBillPayment(
  id: number,
  workspaceId: number,
  data: {
    amount?: number;
    paidAt?: string;
    notes?: string | null;
    proofUrl?: string | null;
    proofFilename?: string | null;
  },
): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.amount !== undefined) {
    fields.push("amount = ?");
    params.push(data.amount);
  }
  if (data.paidAt !== undefined) {
    fields.push("paid_at = ?");
    params.push(data.paidAt);
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?");
    params.push(data.notes);
  }
  if (data.proofUrl !== undefined) {
    fields.push("proof_url = ?");
    params.push(data.proofUrl);
  }
  if (data.proofFilename !== undefined) {
    fields.push("proof_filename = ?");
    params.push(data.proofFilename);
  }

  if (fields.length === 0) return;
  params.push(id, workspaceId);
  await execute(
    `UPDATE BillPayment SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ? AND workspace_id = ?`,
    params,
  );
}

export async function deleteBillPayment(id: number, workspaceId: number): Promise<void> {
  await execute("DELETE FROM BillPayment WHERE id = ? AND workspace_id = ?", [id, workspaceId]);
}
