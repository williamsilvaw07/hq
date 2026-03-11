import { NextResponse } from "next/server";
import { requireAuth, comparePassword, hashPassword } from "@/lib/auth";
import { findUserById } from "@/lib/repos/user-repo";

export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const currentPassword = typeof body.current_password === "string" ? body.current_password : "";
    const newPassword = typeof body.password === "string" ? body.password : "";
    const passwordConfirmation = typeof body.password_confirmation === "string" ? body.password_confirmation : "";

    if (!currentPassword) {
      return NextResponse.json({ message: "Current password is required." }, { status: 422 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: "The password must be at least 8 characters." }, { status: 422 });
    }
    if (newPassword !== passwordConfirmation) {
      return NextResponse.json({ message: "The password confirmation does not match." }, { status: 422 });
    }

    const user = await findUserById(authUser.id);
    if (!user || !(await comparePassword(currentPassword, user.password))) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 422 });
    }

    // password update using raw query to avoid exposing in repo helper for now
    const newHash = await hashPassword(newPassword);
    // reuse mysql2 helper
    const mysql = await import("@/lib/db");
    await mysql.query("UPDATE User SET password = ?, updated_at = NOW(3) WHERE id = ?", [newHash, authUser.id]);

    return NextResponse.json({ message: "Password updated." });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("POST /api/user/password error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
