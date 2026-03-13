import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { findTransactions } from "@/lib/repos/transaction-repo";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);

    const list = await findTransactions(
      { workspaceId: wid, status: "draft" },
      { orderBy: "t.date DESC, t.id DESC" }
    );

    const data = list.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
      base_amount: Number(t.base_amount ?? t.amount),
      exchange_rate: Number(t.exchange_rate ?? 1),
      date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
      created_at: typeof t.created_at === "string" ? t.created_at : (t.created_at ? new Date(t.created_at).toISOString() : null),
    }));

    return NextResponse.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/transactions/pending error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
