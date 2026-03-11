import { NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/auth";
import { queryOne, getPool } from "@/lib/db";

const EXPIRE_MINUTES = 60;

type ResetTokenRow = { email: string; token: string; created_at: Date | null };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirmation = typeof body.password_confirmation === "string" ? body.password_confirmation : "";

    if (!token || !email) {
      return NextResponse.json({ message: "Token and email are required." }, { status: 422 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "The password must be at least 8 characters." }, { status: 422 });
    }
    if (password !== passwordConfirmation) {
      return NextResponse.json({ message: "The password confirmation does not match." }, { status: 422 });
    }

    const row = await queryOne<ResetTokenRow>("SELECT email, token, created_at FROM PasswordResetToken WHERE email = ? LIMIT 1", [email]);
    if (!row) {
      return NextResponse.json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      }, { status: 422 });
    }

    const createdAt = row.created_at ? new Date(row.created_at) : null;
    if (createdAt && Date.now() - createdAt.getTime() > EXPIRE_MINUTES * 60 * 1000) {
      await getPool().query("DELETE FROM PasswordResetToken WHERE email = ?", [email]).catch(() => {});
      return NextResponse.json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      }, { status: 422 });
    }

    const valid = await comparePassword(token, row.token);
    if (!valid) {
      return NextResponse.json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      }, { status: 422 });
    }

    const newHash = await hashPassword(password);
    const pool = getPool();
    await pool.query("UPDATE User SET password = ?, updated_at = NOW(3) WHERE email = ?", [newHash, email]);
    await pool.query("DELETE FROM PasswordResetToken WHERE email = ?", [email]);

    return NextResponse.json({
      message: "Password has been reset. You can sign in with your new password.",
    });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json({
      message: "This reset link is invalid or has expired. Please request a new one.",
    }, { status: 422 });
  }
}
