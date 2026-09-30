import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "office_session";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export async function createToken(username) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(key());
}

export async function verifyToken(token) {
  try {
    return (await jwtVerify(token, key())).payload;
  } catch {
    return null;
  }
}
