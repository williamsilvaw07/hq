import { NextResponse } from "next/server";
import { comparePassword, createToken, toApiUser } from "@/lib/auth";
import { findUserByEmail } from "@/lib/repos/user-repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "The provided credentials are incorrect.", errors: { email: ["The provided credentials are incorrect."] } },
        { status: 422 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { message: "The provided credentials are incorrect.", errors: { email: ["The provided credentials are incorrect."] } },
        { status: 422 }
      );
    }

    const token = await createToken(user.id, user.email);
    const userPayload = toApiUser(user);

    return NextResponse.json({
      user: userPayload,
      token,
      token_type: "Bearer",
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ message: "Login failed." }, { status: 500 });
  }
}
