import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isUuid, jsonError, readJson } from "@/lib/http";
import { getSession } from "@/lib/session";

// A mentor accepts or declines a pending request (FR-09).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "ALUMNI_MENTOR") return jsonError("Please log in as a mentor.", 401);
  const { requestId } = await params;
  const body = await readJson(request);
  const action = body?.action;
  if (!isUuid(requestId) || (action !== "accept" && action !== "decline")) {
    return jsonError("Invalid request.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock the mentor row so capacity is checked safely (FR-06 capacity).
    const found = await client.query<{ status: string; max_mentees: number; accepted: string }>(
      `SELECT r.status, m.max_mentees,
              (SELECT count(*) FROM mentorship_requests a
               WHERE a.mentor_id = m.mentor_id AND a.status = 'ACCEPTED') AS accepted
       FROM mentorship_requests r
       JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
       WHERE r.request_id = $1 AND m.user_id = $2
       FOR UPDATE OF m, r`,
      [requestId, session.userId],
    );
    if (found.rowCount !== 1) {
      await client.query("ROLLBACK");
      return jsonError("Request not found.", 404);
    }
    const { status, max_mentees, accepted } = found.rows[0];
    if (status !== "PENDING") {
      await client.query("ROLLBACK");
      return jsonError("This request has already been answered.", 409);
    }
    if (action === "accept" && Number(accepted) >= max_mentees) {
      await client.query("ROLLBACK");
      return jsonError(
        "You have reached your maximum number of mentees. Increase it in your profile or decline this request.",
        409,
      );
    }
    await client.query(
      `UPDATE mentorship_requests SET status = $2, response_date = now() WHERE request_id = $1`,
      [requestId, action === "accept" ? "ACCEPTED" : "DECLINED"],
    );
    await client.query("COMMIT");
    return NextResponse.json({ status: action === "accept" ? "ACCEPTED" : "DECLINED" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Answering request failed:", error);
    return jsonError("The request could not be updated. Please try again.", 500);
  } finally {
    client.release();
  }
}
