import { execute } from "@/lib/sql";

/** Creates BillPayment table if it doesn't exist. Safe to call on every request. */
export async function ensureBillPaymentTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS \`BillPayment\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`fixed_bill_id\` INT NOT NULL,
      \`workspace_id\` INT NOT NULL,
      \`paid_by_user_id\` INT NULL,
      \`amount\` DECIMAL(18, 4) NOT NULL,
      \`paid_at\` DATE NOT NULL,
      \`period_month\` TINYINT UNSIGNED NOT NULL,
      \`period_year\` SMALLINT UNSIGNED NOT NULL,
      \`proof_url\` VARCHAR(500) NULL,
      \`proof_filename\` VARCHAR(255) NULL,
      \`notes\` VARCHAR(500) NULL,
      \`source\` VARCHAR(30) NOT NULL DEFAULT 'web',
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`BillPayment_fixed_bill_id_idx\` (\`fixed_bill_id\`),
      INDEX \`BillPayment_workspace_id_idx\` (\`workspace_id\`),
      INDEX \`BillPayment_period_idx\` (\`fixed_bill_id\`, \`period_month\`, \`period_year\`),
      CONSTRAINT \`BillPayment_fixed_bill_id_fkey\` FOREIGN KEY (\`fixed_bill_id\`) REFERENCES \`FixedBill\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`BillPayment_workspace_id_fkey\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`Workspace\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
