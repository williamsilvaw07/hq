import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { fetchOne } from "@/lib/sql";

type IntegrationStatus = {
  telegram_connected: boolean;
  whatsapp_connected: boolean;
  telegram_chat_id: string | null;
  whatsapp_id: string | null;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const { user } = await requireWorkspaceMember(req, wid);

    const row = await fetchOne<{ telegram_chat_id: string | null; whatsapp_id: string | null }>(
      "SELECT telegram_chat_id, whatsapp_id FROM User WHERE id = ? LIMIT 1",
      [user.id],
    );

    const status: IntegrationStatus = {
      telegram_connected: !!row?.telegram_chat_id,
      whatsapp_connected: !!row?.whatsapp_id,
      telegram_chat_id: row?.telegram_chat_id ?? null,
      whatsapp_id: row?.whatsapp_id ?? null,
    };

    return NextResponse.json({ data: status });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    console.error("GET integrations status error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
