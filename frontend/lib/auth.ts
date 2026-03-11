import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "fallback-secret-min-32-chars-long"
);

const JWT_ISSUER = "hq-app";
const JWT_AUDIENCE = "hq-app";
const JWT_EXPIRY = "7d";

export type AuthUser = Pick<User, "id" | "name" | "email" | "avatarUrl">;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: number, email: string): Promise<string> {
  return new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const sub = payload.sub;
    const email = payload.email as string;
    if (!sub || !email) return null;
    const userId = parseInt(sub, 10);
    if (Number.isNaN(userId)) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim() || null;
}

/** Use in API route handlers: returns current user or null if unauthenticated. */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!user || user.email !== payload.email) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/** Throws if not authenticated. Use in protected API routes. */
export async function requireAuth(req: Request): Promise<AuthUser & { avatar_url?: string | null }> {
  const user = await getAuthUser(req);
  if (!user) {
    const err = new Error("Unauthorized");
    (err as unknown as { status: number }).status = 401;
    throw err;
  }
  return { ...user, avatar_url: (user as unknown as { avatar_url?: string | null }).avatar_url };
}

/** Shape expected by frontend (id, name, email, avatar_url). */
export function toApiUser(user: { id: number; name: string; email: string; avatarUrl?: string | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatarUrl ?? null,
  };
}
