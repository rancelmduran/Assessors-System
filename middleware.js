import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "./lib/session";

// Only the future office system is protected. The public site is untouched.
export async function middleware(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token && (await verifyToken(token))) return NextResponse.next();
  return NextResponse.redirect(new URL("/employee/login", req.url));
}

export const config = { matcher: ["/office/:path*"] };
