import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateLinkCode } from "@/lib/telegram/link";

/**
 * POST /api/telegram/link
 * Generates a short-lived linking code for the authenticated user.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const code = await generateLinkCode(authUser.id);
    return NextResponse.json({ data: { code } });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("POST /api/telegram/link error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
