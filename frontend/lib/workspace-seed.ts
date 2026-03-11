import type { PrismaClient } from "@prisma/client";

const DEFAULT_CATEGORIES = [
  { name: "Food & dining", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Bills & utilities", type: "expense" },
  { name: "Other", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Other income", type: "income" },
] as const;

export async function seedDefaultsForWorkspace(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  workspaceId: number
): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await tx.category.create({
      data: { workspaceId, name: c.name, type: c.type },
    });
  }
  await tx.account.create({
    data: {
      workspaceId,
      name: "Cash",
      type: "cash",
      currency: "BRL",
      balance: 0,
    },
  });
}
