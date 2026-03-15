import { NextResponse } from "next/server";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { fetchMany, insertOne } from "@/lib/sql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const { workspaceId } = await requireWorkspaceMember(req, wid);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "active";
    const type = url.searchParams.get("type");

    let sql = `SELECT g.*,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id) AS milestone_count,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id AND is_completed = true) AS milestones_completed,
      (SELECT COUNT(*) FROM goal_notes WHERE goal_id = g.id) AS note_count
      FROM goals g WHERE g.workspace_id = ?`;
    const queryParams: any[] = [workspaceId];

    if (status !== "all") {
      sql += " AND g.status = ?";
      queryParams.push(status);
    }
    if (type) {
      sql += " AND g.type = ?";
      queryParams.push(type);
    }

    sql += " ORDER BY g.created_at DESC";

    const goals = await fetchMany(sql, queryParams);
    return NextResponse.json({ data: goals });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("GET /api/workspaces/[workspaceId]/goals error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId: wid } = await params;
    const { user, workspaceId } = await requireWorkspaceMember(req, wid);

    const body = await req.json();
    const {
      type = "financial",
      name,
      icon,
      color,
      target_amount,
      currency = "BRL",
      deadline,
      contribution_frequency,
      contribution_amount,
      notes,
      milestones,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Goal name is required." }, { status: 422 });
    }

    const goalId = await insertOne(
      `INSERT INTO goals (workspace_id, created_by_user_id, type, name, icon, color, target_amount, currency, deadline, contribution_frequency, contribution_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [workspaceId, user.id, type, name.trim(), icon || null, color || null, target_amount || null, currency, deadline || null, contribution_frequency || null, contribution_amount || null],
    );

    // Create initial milestones if provided
    if (Array.isArray(milestones) && milestones.length > 0) {
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (m.title?.trim()) {
          await insertOne(
            `INSERT INTO goal_milestones (goal_id, title, target_amount, target_date, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
            [goalId, m.title.trim(), m.target_amount || null, m.target_date || null, i],
          );
        }
      }
    }

    // Create initial note if provided
    if (notes?.trim()) {
      await insertOne(
        `INSERT INTO goal_notes (goal_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))`,
        [goalId, user.id, notes.trim()],
      );
    }

    return NextResponse.json({ data: { id: goalId } }, { status: 201 });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (e.status === 404) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    console.error("POST /api/workspaces/[workspaceId]/goals error:", e);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
