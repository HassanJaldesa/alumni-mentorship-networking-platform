import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isUuid, jsonError, readJson } from "@/lib/http";
import { getSession } from "@/lib/session";

// An administrator activates or deactivates an account (FR-12). A deactivated
// user cannot log in again and is left out of recommendations.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return jsonError("Administrators only.", 403);
  const { userId } = await params;
  const body = await readJson(request);
  if (!isUuid(userId) || typeof body?.isActive !== "boolean") return jsonError("Invalid request.", 400);
  if (userId === session.userId) return jsonError("You cannot deactivate your own account.", 409);

  const rows = await query<{ is_active: boolean }>(
    "UPDATE users SET is_active = $2 WHERE user_id = $1 RETURNING is_active",
    [userId, body.isActive],
  );
  if (rows.length === 0) return jsonError("User not found.", 404);
  return NextResponse.json({ isActive: rows[0].is_active });
}
