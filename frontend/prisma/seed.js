const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL || "admin@example.com";
  const password = process.env.SEED_USER_PASSWORD || "changeme123";
  const name = process.env.SEED_USER_NAME || "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "workspace";
  let baseSlug = slug;
  let n = 1;
  while (await prisma.workspace.findUnique({ where: { slug: baseSlug } })) {
    baseSlug = `${slug}-${n}`;
    n++;
  }

  const workspace = await prisma.workspace.create({
    data: { name: `${name}'s Workspace`, slug: baseSlug },
  });
  await prisma.workspaceUser.create({
    data: { workspaceId: workspace.id, userId: user.id, role: "owner" },
  });

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
    await prisma.category.create({
      data: { workspaceId: workspace.id, name: c.name, type: c.type },
    });
  }
  await prisma.account.create({
    data: { workspaceId: workspace.id, name: "Cash", type: "cash", currency: "BRL", balance: 0 },
  });

  console.log("Created user:", email);
  console.log("Created workspace:", workspace.name);
  console.log("Login with:", email, "/", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
