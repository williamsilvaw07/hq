import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, toApiUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirmation = typeof body.password_confirmation === "string" ? body.password_confirmation : "";

    if (!name || name.length > 255) {
      return NextResponse.json({ message: "The name field is required." }, { status: 422 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "The email must be a valid email address." }, { status: 422 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "The password must be at least 8 characters." }, { status: 422 });
    }
    if (password !== passwordConfirmation) {
      return NextResponse.json({ message: "The password confirmation does not match." }, { status: 422 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "The email has already been taken.", errors: { email: ["The email has already been taken."] } }, { status: 422 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = await createToken(user.id, user.email);
    const userPayload = toApiUser(user);

    return NextResponse.json(
      {
        user: userPayload,
        token,
        token_type: "Bearer",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
