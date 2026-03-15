import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateWhatsAppLinkCode } from "@/lib/whatsapp/link";

/**
 * POST /api/workspaces/[workspaceId]/whatsapp/link
 * Generates a short-lived linking code tied to this specific workspace.
 * When the user sends the code to the WhatsApp bot, their account will be linked.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const authUser = await requireAuth(req);
    const workspaceId = Number(wid);
    if (!workspaceId) {
      return NextResponse.json({ message: "Invalid workspace." }, { status: 400 });
    }
    const code = await generateWhatsAppLinkCode(authUser.id, workspaceId);
    return NextResponse.json({ data: { code } });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("POST /api/workspaces/[workspaceId]/whatsapp/link error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
