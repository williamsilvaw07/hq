import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const timestamp = Date.now();

  // #region agent log
  fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "620eb3",
    },
    body: JSON.stringify({
      sessionId: "620eb3",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "app/api/health/db/route.ts:GET:start",
      message: "DB health check started",
      data: {},
      timestamp,
    }),
  }).catch(() => {});
  // #endregion

  try {
    const rows = await query("SELECT 1 AS ok");

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "620eb3",
      },
      body: JSON.stringify({
        sessionId: "620eb3",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "app/api/health/db/route.ts:GET:success",
        message: "DB health check succeeded",
        data: { rows },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "620eb3",
      },
      body: JSON.stringify({
        sessionId: "620eb3",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "app/api/health/db/route.ts:GET:error",
        message: "DB health check error",
        data: { error: e?.message ?? String(e) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}

