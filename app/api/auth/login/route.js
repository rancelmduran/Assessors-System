import bcrypt from "bcryptjs";
import { COOKIE_NAME, createToken } from "../../../../lib/session";

export const runtime = "nodejs";

// Phase 1: single account from env vars. Phase 2 can swap this check for a user store.
export async function POST(req) {
  const { AUTH_SECRET, EMPLOYEE_USERNAME, EMPLOYEE_PASSWORD_HASH_B64 } = process.env;
  if (!AUTH_SECRET || !EMPLOYEE_USERNAME || !EMPLOYEE_PASSWORD_HASH_B64) {
    return Response.json({ error: "Login is not configured." }, { status: 500 });
  }

  const { username, password } = await req.json().catch(() => ({}));
  const hash = Buffer.from(EMPLOYEE_PASSWORD_HASH_B64, "base64").toString("utf8");
  const ok =
    typeof username === "string" &&
    typeof password === "string" &&
    username === EMPLOYEE_USERNAME &&
    (await bcrypt.compare(password, hash));

  if (!ok) return Response.json({ error: "Invalid username or password." }, { status: 401 });

  const token = await createToken(username);
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
  return res;
}
