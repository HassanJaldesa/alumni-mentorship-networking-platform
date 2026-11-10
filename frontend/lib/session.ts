import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";
const SESSION_HOURS = 12;

export type Role = "STUDENT" | "ALUMNI_MENTOR" | "ADMIN";

export interface SessionPayload {
  userId: string;
  role: Role;
  firstName: string;
}

const ROLES: Role[] = ["STUDENT", "ALUMNI_MENTOR", "ADMIN"];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

// Creates a signed token (HS256) that expires after 12 hours.
export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ role: payload.role, firstName: payload.firstName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

// Returns the session if the token is valid, or null if it is missing,
// tampered with or expired.
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const role = payload.role as Role;
    if (!payload.sub || !ROLES.includes(role)) return null;
    return {
      userId: payload.sub,
      role,
      firstName: String(payload.firstName ?? ""),
    };
  } catch {
    return null;
  }
}

// Cookie settings: not readable by JavaScript, sent only to this site.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

// Reads the logged-in user in server components and API routes.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}