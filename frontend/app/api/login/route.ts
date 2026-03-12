import { NextResponse } from "next/server";
import { comparePassword, createToken, toApiUser } from "@/lib/auth";
import { findUserByEmail } from "@/lib/repos/user-repo";

const DEBUG_LOG = (payload: Record<string, unknown>) => {
  // #region agent log
  fetch("http://127.0.0.1:7615/ingest/da303532-0e08-486a-895e-4daefa467a25", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d48064" },
    body: JSON.stringify({ sessionId: "d48064", ...payload, timestamp: Date.now() }),
  }).catch(() => {});
  // #endregion
};

export async function POST(req: Request) {
  try {
    // #region agent log
    DEBUG_LOG({ location: "login/route.ts:entry", message: "POST login started", hypothesisId: "A", data: {} });
    // #endregion
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "The provided credentials are incorrect.", errors: { email: ["The provided credentials are incorrect."] } },
        { status: 422 }
      );
    }

    // #region agent log
    DEBUG_LOG({ location: "login/route.ts:beforeFindUser", message: "before findUserByEmail", hypothesisId: "B", data: { emailLen: email.length } });
    // #endregion
    const user = await findUserByEmail(email);
    // #region agent log
    DEBUG_LOG({ location: "login/route.ts:afterFindUser", message: "after findUserByEmail", hypothesisId: "B", data: { userFound: !!user, hasPassword: !!(user?.password) } });
    // #endregion
    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { message: "The provided credentials are incorrect.", errors: { email: ["The provided credentials are incorrect."] } },
        { status: 422 }
      );
    }

    // #region agent log
    DEBUG_LOG({ location: "login/route.ts:beforeCreateToken", message: "before createToken", hypothesisId: "D", data: { userId: user.id } });
    // #endregion
    const token = await createToken(user.id, user.email);
    // #region agent log
    DEBUG_LOG({ location: "login/route.ts:afterCreateToken", message: "after createToken", hypothesisId: "D", data: { hasToken: !!token } });
    // #endregion
    const userPayload = toApiUser({ ...user, avatarUrl: user.avatar_url });

    return NextResponse.json({
      user: userPayload,
      token,
      token_type: "Bearer",
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    // #region agent log
    DEBUG_LOG({
      location: "login/route.ts:catch",
      message: "login catch",
      hypothesisId: "E",
      data: { errorName: err.name, errorMessage: err.message },
    });
    // #endregion
    console.error("Login error:", e);
    const showDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_LOGIN === "1";
    return NextResponse.json(
      { message: "Login failed.", ...(showDebug && { _debug: err.message }) },
      { status: 500 }
    );
  }
}
