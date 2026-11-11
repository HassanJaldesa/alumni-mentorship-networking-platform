import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// An administrator creates another administrator account (FR-01, FR-12).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return jsonError("Administrators only.", 403);

  const body = await readJson(request);
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
    return jsonError("First and last name are required.", 400);
  }
  if (!EMAIL_PATTERN.test(email)) return jsonError("Enter a valid email address.", 400);
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return jsonError("Password must be 8 to 72 characters with at least one letter and one number.", 400);
  }

  try {
    const rows = await query<{ user_id: string }>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, consent_given_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', now()) RETURNING user_id`,
      [firstName, lastName, email, await hashPassword(password)],
    );
    return NextResponse.json({ userId: rows[0].user_id }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return jsonError("An account with this email already exists.", 409);
    }
    throw error;
  }
}
