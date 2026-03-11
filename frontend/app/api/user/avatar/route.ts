import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth, toApiUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const formData = await req.formData();
    const file = formData.get("avatar");
    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Avatar file is required." }, { status: 422 });
    }

    const blob = file as Blob;
    if (blob.size > MAX_SIZE) {
      return NextResponse.json({ message: "File too large (max 2MB)." }, { status: 422 });
    }
    const type = blob.type;
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ message: "Invalid file type. Use JPEG, PNG, GIF or WebP." }, { status: 422 });
    }

    const ext = type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : type === "image/gif" ? "gif" : "webp";
    const dir = join(process.cwd(), "public", "uploads", "avatars", String(authUser.id));
    await mkdir(dir, { recursive: true });
    const filename = `avatar-${Date.now()}.${ext}`;
    const path = join(dir, filename);
    const buffer = Buffer.from(await blob.arrayBuffer());
    await writeFile(path, buffer);

    const url = `/uploads/avatars/${authUser.id}/${filename}`;
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl: url },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    return NextResponse.json({ data: toApiUser(user) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    console.error("POST /api/user/avatar error:", e);
    return NextResponse.json({ message: "Upload failed." }, { status: 500 });
  }
}
