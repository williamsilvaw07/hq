import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/** GET /api/db-status - Check if the app can connect to the database. */
export async function GET() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("DB status check failed:", e);
    return NextResponse.json(
      { ok: false, database: "error", error: message },
      { status: 503 }
    );
  }
}
