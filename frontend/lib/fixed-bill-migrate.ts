import { execute } from "@/lib/sql";

/** Creates FixedBill table if it doesn't exist. Safe to call on every request. */
export async function ensureFixedBillTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS \`FixedBill\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`workspace_id\` INT NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`category\` VARCHAR(191) NOT NULL DEFAULT 'General',
      \`amount\` DECIMAL(18, 4) NOT NULL DEFAULT 0,
      \`icon\` VARCHAR(20) NULL,
      \`due\` DATE NOT NULL,
      \`frequency\` VARCHAR(20) NOT NULL DEFAULT 'monthly',
      \`day_of_month\` TINYINT UNSIGNED NULL,
      \`day_of_week\` TINYINT UNSIGNED NULL,
      \`end_date\` DATE NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`FixedBill_workspace_id_idx\` (\`workspace_id\`),
      CONSTRAINT \`FixedBill_workspace_id_fkey\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`Workspace\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
