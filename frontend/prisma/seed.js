const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  const password = process.env.DB_PASSWORD || "";
  const port = parseInt(process.env.DB_PORT || "3306", 10);

  if (!host || !user || !database) {
    throw new Error("Set DB_HOST, DB_USER, and DB_NAME (optionally DB_PORT, DB_PASSWORD)");
  }

  const pool = mysql.createPool({ host, port, user, password, database });

  const email = process.env.SEED_USER_EMAIL || "admin@example.com";
  const passwordPlain = process.env.SEED_USER_PASSWORD || "changeme123";
  const name = process.env.SEED_USER_NAME || "Admin";

  const [existingRows] = await pool.query("SELECT id FROM User WHERE email = ? LIMIT 1", [email]);
  if (existingRows.length > 0) {
    console.log("User already exists:", email);
    await pool.end();
    return;
  }

  const hashedPassword = await bcrypt.hash(passwordPlain, 10);
  const [userRes] = await pool.query(
    "INSERT INTO User (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
    [name, email, hashedPassword]
  );
  const userId = userRes.insertId;

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "workspace";
  let baseSlug = slug;
  let n = 1;
  let [slugRows] = await pool.query("SELECT id FROM Workspace WHERE slug = ? LIMIT 1", [baseSlug]);
  while (slugRows.length > 0) {
    baseSlug = `${slug}-${n}`;
    n++;
    [slugRows] = await pool.query("SELECT id FROM Workspace WHERE slug = ? LIMIT 1", [baseSlug]);
  }

  const [wsRes] = await pool.query(
    "INSERT INTO Workspace (name, slug, created_at, updated_at) VALUES (?, ?, NOW(3), NOW(3))",
    [`${name}'s Workspace`, baseSlug]
  );
  const workspaceId = wsRes.insertId;

  await pool.query(
    "INSERT INTO workspace_users (workspace_id, user_id, role, created_at, updated_at) VALUES (?, ?, 'owner', NOW(3), NOW(3))",
    [workspaceId, userId]
  );

  const defaultCategories = [
    { name: "Food & dining", type: "expense" },
    { name: "Transport", type: "expense" },
    { name: "Shopping", type: "expense" },
    { name: "Bills & utilities", type: "expense" },
    { name: "Other", type: "expense" },
    { name: "Salary", type: "income" },
    { name: "Freelance", type: "income" },
    { name: "Other income", type: "income" },
  ];
  for (const c of defaultCategories) {
    await pool.query(
      "INSERT INTO Category (workspace_id, name, type, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
      [workspaceId, c.name, c.type]
    );
  }
  await pool.query(
    "INSERT INTO Account (workspace_id, name, type, currency, balance, include_in_net_balance, created_at, updated_at) VALUES (?, ?, 'cash', 'BRL', 0, 1, NOW(3), NOW(3))",
    [workspaceId, "Cash"]
  );

  console.log("Created user:", email);
  console.log("Created workspace:", `${name}'s Workspace`);
  console.log("Login with:", email, "/", passwordPlain);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
