import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, toApiUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ data: toApiUser(user) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("GET /api/user error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const avatarUrl = body.avatar_url !== undefined ? (body.avatar_url === null ? null : String(body.avatar_url)) : undefined;

    if (name !== undefined && (name.length === 0 || name.length > 255)) {
      return NextResponse.json({ message: "Invalid name." }, { status: 422 });
    }
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ message: "The email must be a valid email address." }, { status: 422 });
      }
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: authUser.id } } });
      if (existing) {
        return NextResponse.json({ message: "The email has already been taken.", errors: { email: ["The email has already been taken."] } }, { status: 422 });
      }
    }
    if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl.length > 500) {
      return NextResponse.json({ message: "Invalid avatar_url." }, { status: 422 });
    }

    const data: { name?: string; email?: string; avatarUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    if (Object.keys(data).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { id: true, name: true, email: true, avatarUrl: true },
      });
      return user ? NextResponse.json({ data: toApiUser(user) }) : NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data,
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    return NextResponse.json({ data: toApiUser(user) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("PATCH /api/user error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
