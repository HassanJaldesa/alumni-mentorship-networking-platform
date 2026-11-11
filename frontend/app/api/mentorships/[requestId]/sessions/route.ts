import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { getParticipantRole } from "@/lib/mentorships";
import { getSession } from "@/lib/session";
import { futureDate, SESSION_LIMITS } from "@/lib/sessionRules";

// Either participant schedules a session in an accepted mentorship (FR-10).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  const { requestId } = await params;
  const participant = await getParticipantRole(session.userId, requestId);
  if (!participant) return jsonError("Mentorship not found.", 404);
  if (participant.status !== "ACCEPTED") {
    return jsonError("Sessions can only be scheduled once the mentor has accepted.", 409);
  }

  const body = await readJson(request);
  const topic = String(body?.topic ?? "").trim();
  const scheduled = futureDate(body?.scheduledDate);
  const duration = Number(body?.duration);
  if (topic.length < SESSION_LIMITS.topic.min || topic.length > SESSION_LIMITS.topic.max) {
    return jsonError("Enter a topic of 3 to 200 characters.", 400);
  }
  if (!scheduled) return jsonError("Choose a date and time in the future.", 400);
  if (
    !Number.isInteger(duration) ||
    duration < SESSION_LIMITS.duration.min ||
    duration > SESSION_LIMITS.duration.max
  ) {
    return jsonError("Duration must be 15 to 240 minutes.", 400);
  }

  const rows = await query<{ session_id: string }>(
    `INSERT INTO mentorship_sessions (request_id, topic, scheduled_date, duration)
     VALUES ($1, $2, $3, $4) RETURNING session_id`,
    [requestId, topic, scheduled.toISOString(), duration],
  );
  return NextResponse.json({ sessionId: rows[0].session_id }, { status: 201 });
}
