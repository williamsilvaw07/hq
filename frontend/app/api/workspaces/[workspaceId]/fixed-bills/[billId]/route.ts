import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { ensureFixedBillTable } from "@/lib/fixed-bill-migrate";
import {
  findFixedBillById,
  updateFixedBill,
  deleteFixedBill,
} from "@/lib/repos/fixed-bill-repo";
import { computeNextOccurrence } from "@/lib/fixed-expenses";

function toApiBill(row: {
  id: number;
  name: string;
  category: string;
  amount: number;
  icon: string | null;
  due: string;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  end_date: string | null;
  payment_link?: string | null;
  notes?: string | null;
  login_email?: string | null;
  login_password?: string | null;
}) {
  const dueStr = typeof row.due === "string" ? row.due.slice(0, 10) : new Date(row.due).toISOString().slice(0, 10);

  const billForCalc = {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    icon: row.icon,
    due: dueStr,
    dueSoon: false,
    frequency: row.frequency as "monthly" | "weekly",
    dayOfMonth: row.day_of_month,
    dayOfWeek: row.day_of_week,
    endDate: row.end_date,
  };
  const nextOccurrence = computeNextOccurrence(billForCalc);
  let dueSoon = false;
  if (nextOccurrence) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((nextOccurrence.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    dueSoon = diffDays >= 0 && diffDays <= 5;
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    icon: row.icon,
    due: dueStr,
    dueSoon,
    frequency: row.frequency as "monthly" | "weekly",
    dayOfMonth: row.day_of_month,
    dayOfWeek: row.day_of_week,
    endDate: row.end_date,
    paymentLink: row.payment_link ?? null,
    notes: row.notes ?? null,
    loginEmail: row.login_email ?? null,
    loginPassword: row.login_password ?? null,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; billId: string }> }
) {
  try {
    const { workspaceId, billId } = await params;
    const { workspaceId: wid } = await requireWorkspaceAdmin(req, workspaceId);
    await ensureFixedBillTable();
    const id = parseInt(billId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const existing = await findFixedBillById(id, wid);
    if (!existing) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const body = await req.json();
    const data: Parameters<typeof updateFixedBill>[2] = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.category === "string") data.category = body.category.trim();
    if (typeof body.amount === "number") data.amount = body.amount;
    else if (body.amount != null) data.amount = parseFloat(String(body.amount)) || 0;
    if (body.icon !== undefined) data.icon = body.icon;
    if (typeof body.due === "string") data.due = body.due;
    if (body.frequency === "weekly" || body.frequency === "monthly") data.frequency = body.frequency;
    if (body.dayOfMonth !== undefined) data.dayOfMonth = body.dayOfMonth;
    if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.paymentLink !== undefined) data.paymentLink = typeof body.paymentLink === "string" && body.paymentLink.trim() ? body.paymentLink.trim() : null;
    if (body.notes !== undefined) data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
    if (body.loginEmail !== undefined) data.loginEmail = typeof body.loginEmail === "string" && body.loginEmail.trim() ? body.loginEmail.trim() : null;
    if (body.loginPassword !== undefined) data.loginPassword = typeof body.loginPassword === "string" && body.loginPassword.trim() ? body.loginPassword.trim() : null;

    await updateFixedBill(id, wid, data);
    const updated = await findFixedBillById(id, wid);
    return NextResponse.json({ data: updated ? toApiBill(updated) : toApiBill(existing) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id]/fixed-bills/[billId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; billId: string }> }
) {
  try {
    const { workspaceId, billId } = await params;
    const { workspaceId: wid } = await requireWorkspaceAdmin(req, workspaceId);
    await ensureFixedBillTable();
    const id = parseInt(billId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const existing = await findFixedBillById(id, wid);
    if (!existing) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    await deleteFixedBill(id, wid);
    return NextResponse.json({ data: { deleted: true } });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id]/fixed-bills/[billId] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
