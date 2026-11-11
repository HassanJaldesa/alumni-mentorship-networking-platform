import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isUuid, jsonError, readJson } from "@/lib/http";
import { getSession } from "@/lib/session";

const MAX_MESSAGE = 1000;

// A student sends a mentorship request (FR-08). Middleware already limits
// /api/student to students.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return jsonError("Please log in as a student.", 401);

  const body = await readJson(request);
  if (!body || !isUuid(body.mentorId)) return jsonError("Choose a mentor.", 400);
  const message = String(body.message ?? "").trim();
  if (message.length > MAX_MESSAGE) {
    return jsonError(`The message can be at most ${MAX_MESSAGE} characters.`, 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const student = await client.query<{ student_id: string }>(
      `SELECT s.student_id FROM students s JOIN profiles p ON p.user_id = s.user_id
       WHERE s.user_id = $1`,
      [session.userId],
    );
    if (student.rowCount !== 1) {
      await client.query("ROLLBACK");
      return jsonError("Complete your onboarding questionnaire first.", 409);
    }
    const studentId = student.rows[0].student_id;

    // Lock the mentor row so two requests cannot both take the last place.
    const mentor = await client.query<{ max_mentees: number; accepted: string; mine: string }>(
      `SELECT m.max_mentees,
              (SELECT count(*) FROM mentorship_requests r
               WHERE r.mentor_id = m.mentor_id AND r.status = 'ACCEPTED') AS accepted,
              (SELECT count(*) FROM mentorship_requests r
               WHERE r.mentor_id = m.mentor_id AND r.student_id = $2 AND r.status = 'ACCEPTED') AS mine
       FROM alumni_mentors m JOIN users u ON u.user_id = m.user_id AND u.is_active
       WHERE m.mentor_id = $1
       FOR UPDATE OF m`,
      [body.mentorId, studentId],
    );
    if (mentor.rowCount !== 1) {
      await client.query("ROLLBACK");
      return jsonError("This mentor is not available.", 404);
    }
    const { max_mentees, accepted, mine } = mentor.rows[0];
    if (Number(mine) > 0) {
      await client.query("ROLLBACK");
      return jsonError("This mentor is already mentoring you.", 409);
    }
    if (Number(accepted) >= max_mentees) {
      await client.query("ROLLBACK");
      return jsonError("This mentor has no free mentee places right now.", 409);
    }

    // Link the request to the recommendation it came from, if there is one,
    // so the reports can measure the request rate (FR-13).
    const inserted = await client.query<{ request_id: string }>(
      `INSERT INTO mentorship_requests (student_id, mentor_id, recommendation_id, message)
       VALUES ($1, $2,
         (SELECT r.recommendation_id FROM mentor_recommendations r
          WHERE r.student_id = $1 AND r.mentor_id = $2
            AND NOT EXISTS (SELECT 1 FROM mentorship_requests q
                            WHERE q.recommendation_id = r.recommendation_id)),
         $3)
       RETURNING request_id`,
      [studentId, body.mentorId, message || null],
    );
    await client.query("COMMIT");
    return NextResponse.json({ requestId: inserted.rows[0].request_id }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return jsonError("You already have a pending request to this mentor.", 409);
    }
    console.error("Creating request failed:", error);
    return jsonError("Your request could not be sent. Please try again.", 500);
  } finally {
    client.release();
  }
}
