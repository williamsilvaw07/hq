import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthUser } from "@/lib/auth";

export type WorkspaceMemberRole = "owner" | "admin" | "member" | "viewer";

export type WorkspaceMemberInfo = {
  id: number;
  user_id: number;
  role: string;
  name: string;
  email: string;
};

/** Returns current user and their workspace membership; throws if not a member. */
export async function requireWorkspaceMember(
  req: Request,
  workspaceIdParam: string,
  options?: { minRole?: WorkspaceMemberRole }
): Promise<{ user: AuthUser & { avatar_url?: string | null }; role: string; workspaceId: number }> {
  const user = await requireAuth(req);
  const workspaceId = parseInt(workspaceIdParam, 10);
  if (Number.isNaN(workspaceId)) {
    const err = new Error("Workspace not found.");
    (err as unknown as { status: number }).status = 404;
    throw err;
  }

  const membership = await prisma.workspaceUser.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (!membership) {
    const err = new Error("Workspace not found.");
    (err as unknown as { status: number }).status = 404;
    throw err;
  }

  const roleOrder: WorkspaceMemberRole[] = ["viewer", "member", "admin", "owner"];
  if (options?.minRole) {
    const minIndex = roleOrder.indexOf(options.minRole);
    const userIndex = roleOrder.indexOf(membership.role as WorkspaceMemberRole);
    if (minIndex === -1 || userIndex < minIndex) {
      const err = new Error("You do not have permission to manage members.");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  }

  return {
    user: { ...user, avatar_url: (user as unknown as { avatar_url?: string | null }).avatar_url },
    role: membership.role,
    workspaceId,
  };
}

/** Check if user is admin or owner of the workspace. */
export async function requireWorkspaceAdmin(
  req: Request,
  workspaceIdParam: string
): Promise<{ user: AuthUser; role: string; workspaceId: number }> {
  return requireWorkspaceMember(req, workspaceIdParam, { minRole: "admin" });
}
