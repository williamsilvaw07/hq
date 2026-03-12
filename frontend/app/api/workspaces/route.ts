import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { seedDefaultsForWorkspace } from "@/lib/workspace-seed";
import { listWorkspacesForUser, createWorkspaceForUser } from "@/lib/repos/workspace-repo";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const workspaces = await listWorkspacesForUser(user.id);
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

    const workspace = await createWorkspaceForUser(user.id, name, slugInput);
    await seedDefaultsForWorkspace(workspace.id);
    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    console.error("POST /api/workspaces error:", e);
    return NextResponse.json({ message: "A workspace with this name may already exist. Try a different name." }, { status: 422 });
  }
}
