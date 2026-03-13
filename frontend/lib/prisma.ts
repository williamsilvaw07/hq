import { PrismaClient } from "@prisma/client";

// Fallback: build DATABASE_URL from DB_* vars when DATABASE_URL is unset (e.g. Hostinger uses DB_*)
if (!process.env.DATABASE_URL && process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  const password = encodeURIComponent(process.env.DB_PASSWORD || "");
  const port = process.env.DB_PORT || "3306";
  process.env.DATABASE_URL = `mysql://${process.env.DB_USER}:${password}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
