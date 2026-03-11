import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const categories = await prisma.category.findMany({
      where: { workspaceId: wid },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: categories });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id]/categories error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = typeof body.type === "string" ? body.type : "";
    const icon = typeof body.icon === "string" ? body.icon : null;
    const color = typeof body.color === "string" ? body.color : null;

    if (!name || name.length > 255) {
      return NextResponse.json({ message: "The name field is required." }, { status: 422 });
    }
    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ message: "The type must be income or expense." }, { status: 422 });
    }

    const category = await prisma.category.create({
      data: { workspaceId: wid, name, type, icon, color },
    });
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[id]/categories error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
