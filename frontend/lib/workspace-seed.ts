import { execute } from "@/lib/sql";

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

export async function seedDefaultsForWorkspace(workspaceId: number): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await execute(
      "INSERT INTO Category (workspace_id, name, type, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
      [workspaceId, c.name, c.type],
    );
  }
  await execute(
    "INSERT INTO Account (workspace_id, name, type, currency, balance, include_in_net_balance, created_at, updated_at) VALUES (?, 'Cash', 'cash', 'BRL', 0, 1, NOW(3), NOW(3))",
    [workspaceId],
  );
}
