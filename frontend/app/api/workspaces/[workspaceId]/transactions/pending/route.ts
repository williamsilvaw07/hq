import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);

    const list = await prisma.transaction.findMany({
      where: { workspaceId: wid, status: "draft" },
      include: { category: true },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    const data = list.map((t) => ({
      ...t,
      amount: Number(t.amount),
      base_amount: Number(t.baseAmount),
      exchange_rate: Number(t.exchangeRate),
      date: t.date.toISOString().slice(0, 10),
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
