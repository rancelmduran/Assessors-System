import { COOKIE_NAME } from "../../../../lib/session";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
