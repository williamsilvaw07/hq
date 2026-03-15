import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { ensureFixedBillTable } from "@/lib/fixed-bill-migrate";
import {
  findFixedBillsByWorkspace,
  createFixedBill,
} from "@/lib/repos/fixed-bill-repo";

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
}) {
  const dueStr = typeof row.due === "string" ? row.due.slice(0, 10) : new Date(row.due).toISOString().slice(0, 10);
  const dueDate = new Date(dueStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const dueSoon = diffDays >= 0 && diffDays <= 5;

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
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    await ensureFixedBillTable();
    const rows = await findFixedBillsByWorkspace(wid);
    const data = rows.map(toApiBill);
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/fixed-bills error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceAdmin(req, workspaceId);
    await ensureFixedBillTable();
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "New bill";
    const category = typeof body.category === "string" ? body.category.trim() : "General";
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0)) || 0;
    const icon = typeof body.icon === "string" ? body.icon : null;
    const due = typeof body.due === "string" ? body.due : new Date().toISOString().slice(0, 10);
    const frequency = body.frequency === "weekly" ? "weekly" : "monthly";
    const dayOfMonth = typeof body.dayOfMonth === "number" ? body.dayOfMonth : null;
    const dayOfWeek = typeof body.dayOfWeek === "number" ? body.dayOfWeek : null;
    const endDate = typeof body.endDate === "string" && body.endDate ? body.endDate : null;

    const id = await createFixedBill({
      workspaceId: wid,
      name,
      category,
      amount,
      icon,
      due,
      frequency,
      dayOfMonth,
      dayOfWeek,
      endDate,
    });

    const rows = await findFixedBillsByWorkspace(wid);
    const created = rows.find((r) => r.id === id);
    if (!created) {
      return NextResponse.json(
        { data: { id, name, category, amount, icon, due, dueSoon: false, frequency, dayOfMonth, dayOfWeek, endDate } },
        { status: 201 }
      );
    }
    return NextResponse.json({ data: toApiBill(created) }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/fixed-bills error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
