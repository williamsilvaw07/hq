import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { ensureFixedBillTable } from "@/lib/fixed-bill-migrate";
import { ensureBillPaymentTable } from "@/lib/bill-payment-migrate";
import { findPaymentsByWorkspaceMonth, type BillPaymentRow } from "@/lib/repos/bill-payment-repo";

function toApi(row: BillPaymentRow) {
  const paidAt =
    typeof row.paid_at === "string"
      ? row.paid_at.slice(0, 10)
      : new Date(row.paid_at).toISOString().slice(0, 10);
  return {
    id: row.id,
    fixedBillId: row.fixed_bill_id,
    paidByUserId: row.paid_by_user_id,
    amount: Number(row.amount),
    paidAt,
    periodMonth: row.period_month,
    periodYear: row.period_year,
    proofUrl: row.proof_url,
    proofFilename: row.proof_filename,
    notes: row.notes,
    source: row.source,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    await ensureFixedBillTable();
    await ensureBillPaymentTable();

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get("month") ?? "", 10);
    const year = parseInt(url.searchParams.get("year") ?? "", 10);

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ message: "month and year query params required." }, { status: 422 });
    }

    const rows = await findPaymentsByWorkspaceMonth(wid, month, year);
    return NextResponse.json({ data: rows.map(toApi) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Not found." }, { status: 404 });
    console.error("GET bill-payments error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
