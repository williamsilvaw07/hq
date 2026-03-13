import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchMany } from "@/lib/sql";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);

    const [accounts, creditCards] = await Promise.all([
      fetchMany(
        `SELECT * FROM Account WHERE workspace_id = ? ORDER BY name ASC`,
        [wid]
      ),
      fetchMany(
        `SELECT * FROM CreditCard WHERE workspace_id = ? ORDER BY name ASC`,
        [wid]
      ),
    ]);

    const accountsData = accounts.map((a: any) => ({
      ...a,
      balance: Number(a.balance ?? 0),
    }));
    const credit_cards = creditCards.map((c: any) => ({
      ...c,
      credit_limit: Number(c.credit_limit ?? 0),
      current_balance: Number(c.current_balance ?? 0),
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
