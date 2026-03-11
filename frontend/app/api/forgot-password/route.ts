import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

const EXPIRE_MINUTES = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "The email must be a valid email address." }, { status: 422 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const hashedToken = await hashPassword(rawToken);
      const expiresAt = new Date(Date.now() + EXPIRE_MINUTES * 60 * 1000);

      await prisma.passwordResetToken.upsert({
        where: { email },
        create: { email, token: hashedToken, createdAt: new Date() },
        update: { token: hashedToken, createdAt: new Date() },
      });

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(/\/+$/, "");
      const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
      await sendPasswordResetEmail(email, resetLink);
    }

    return NextResponse.json({
      message: "If that email is registered, we sent a password reset link.",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
