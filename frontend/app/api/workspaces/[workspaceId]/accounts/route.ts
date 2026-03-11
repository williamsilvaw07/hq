import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);

    const [accounts, creditCards] = await Promise.all([
      prisma.account.findMany({
        where: { workspaceId: wid },
        orderBy: { name: "asc" },
      }),
      prisma.creditCard.findMany({
        where: { workspaceId: wid },
        orderBy: { name: "asc" },
      }),
    ]);

    const accountsData = accounts.map((a) => ({
      ...a,
      balance: Number(a.balance),
    }));
    const credit_cards = creditCards.map((c) => ({
      ...c,
      credit_limit: Number(c.creditLimit),
      current_balance: Number(c.currentBalance),
    }));

    return NextResponse.json({
      data: {
        accounts: accountsData,
        credit_cards,
      },
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/accounts error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
