import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { seedDefaultsForWorkspace } from "@/lib/workspace-seed";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const workspaces = await prisma.workspace.findMany({
      where: {
        workspaceUsers: { some: { userId: user.id } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: workspaces });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("GET /api/workspaces error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim() : null;

    if (!name || name.length > 255) {
      return NextResponse.json({ message: "The name field is required." }, { status: 422 });
    }

    const baseSlug = slugInput || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "workspace";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n}`;
      n++;
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name, slug } });
      await tx.workspaceUser.create({
        data: { workspaceId: ws.id, userId: user.id, role: "owner" },
      });
      await seedDefaultsForWorkspace(tx, ws.id);
      return tx.workspace.findUniqueOrThrow({ where: { id: ws.id } });
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST /api/workspaces error:", e);
    return NextResponse.json({ message: "A workspace with this name may already exist. Try a different name." }, { status: 422 });
  }
}
