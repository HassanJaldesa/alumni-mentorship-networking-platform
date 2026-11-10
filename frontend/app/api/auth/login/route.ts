import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  type Role,
} from "@/lib/session";

// A real bcrypt hash of a random string. Checking against it when the email
// is unknown makes a failed login take the same time either way, so the
// response time does not reveal which emails are registered.
const DUMMY_HASH = "$2b$12$PEAkso6WtE0PQtGKlBNBwuRJfnmHlH3Avi0nQgt1wY0DlB6o5cJ6K";

interface UserRow {
  user_id: string;
  first_name: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const remember = body.remember === true;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  let user: UserRow | undefined;
  try {
    const rows = await query<UserRow>(
      `SELECT user_id, first_name, password_hash, role, is_active
       FROM users WHERE email = $1`,
      [email],
    );
    user = rows[0];
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Login is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
  const passwordMatches = await verifyPassword(
    password,
    user ? user.password_hash : DUMMY_HASH,
  );

  // Same message for a wrong email or a wrong password.
  if (!user || !passwordMatches) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }
  if (!user.is_active) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact the administrator." },
      { status: 403 },
    );
  }

  const token = await createSessionToken({
    userId: user.user_id,
    role: user.role,
    firstName: user.first_name,
  });
    const response = NextResponse.json({ role: user.role });
  // "Remember me" keeps the cookie for 12 hours; otherwise it is deleted
  // when the browser closes. The token itself always expires after 12 hours.
  const cookieOptions = sessionCookieOptions();
  response.cookies.set(
    SESSION_COOKIE,
    token,
    remember ? cookieOptions : { ...cookieOptions, maxAge: undefined },
  );
  return response;
}