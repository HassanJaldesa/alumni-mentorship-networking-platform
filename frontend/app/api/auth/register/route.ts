import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  type Role,
} from "@/lib/session";

// Only students and mentors can sign themselves up; admin accounts are
// created directly in the database.
const SELF_REGISTER_ROLES: Role[] = ["STUDENT", "ALUMNI_MENTOR"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body.");
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = body.role as Role;

  // 1. Validate the input (FR-01).
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
    return badRequest("First and last name are required (up to 100 characters each).");
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return badRequest("Enter a valid email address.");
  }
  if (
    password.length < 8 ||
    password.length > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return badRequest(
      "Password must be 8 to 72 characters and include at least one letter and one number.",
    );
  }
  if (!SELF_REGISTER_ROLES.includes(role)) {
    return badRequest("Choose either Student or Alumni Mentor.");
  }
  if (body.consent !== true) {
    return badRequest("You must agree to how your data is used before registering.");
  }

  // 2. Save the user and their role record together, or neither.
  const passwordHash = await hashPassword(password);
  const client = await pool.connect();
  let userId: string;
  try {
    await client.query("BEGIN");
    const result = await client.query<{ user_id: string }>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, consent_given_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING user_id`,
      [firstName, lastName, email, passwordHash, role],
    );
    userId = result.rows[0].user_id;

    const roleTable = role === "STUDENT" ? "students" : "alumni_mentors";
    await client.query(`INSERT INTO ${roleTable} (user_id) VALUES ($1)`, [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  } finally {
    client.release();
  }

  // 3. Log the new user in straight away so they can go to onboarding.
  const token = await createSessionToken({ userId, role, firstName });
  const response = NextResponse.json({ userId, role }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}