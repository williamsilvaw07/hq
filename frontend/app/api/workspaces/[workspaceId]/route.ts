import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-auth";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const { user, workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
    });
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json({ data: workspace });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[id] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceMember(req, workspaceId);
    const workspaceIdNum = parseInt(workspaceId, 10);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const slug = typeof body.slug === "string" ? body.slug.trim() : undefined;

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceIdNum } });
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }

    const data: { name?: string; slug?: string } = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) {
      const existing = await prisma.workspace.findFirst({ where: { slug, NOT: { id: workspaceIdNum } } });
      if (existing) {
        return NextResponse.json({ message: "The slug has already been taken." }, { status: 422 });
      }
      data.slug = slug;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ data: workspace });
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceIdNum },
      data,
    });
    return NextResponse.json({ data: updated });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("PATCH /api/workspaces/[id] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const { role, workspaceId: workspaceIdNum } = await requireWorkspaceMember(req, workspaceId);
    if (role !== "owner") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }
    await prisma.workspace.delete({ where: { id: workspaceIdNum } });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("DELETE /api/workspaces/[id] error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
