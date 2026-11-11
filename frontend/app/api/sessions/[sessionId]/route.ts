import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isUuid, jsonError, readJson } from "@/lib/http";
import { getSession } from "@/lib/session";
import { futureDate, SESSION_LIMITS } from "@/lib/sessionRules";

// Reschedule, complete or cancel a session, or save its progress notes (FR-10).
// Only the two participants of the mentorship may change it.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  const { sessionId } = await params;
  if (!isUuid(sessionId)) return jsonError("Session not found.", 404);

  const found = await query<{ status: string }>(
    `SELECT s.status FROM mentorship_sessions s
     JOIN mentorship_requests r ON r.request_id = s.request_id AND r.status = 'ACCEPTED'
     JOIN students st ON st.student_id = r.student_id
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     WHERE s.session_id = $1 AND $2 IN (st.user_id, m.user_id)`,
    [sessionId, session.userId],
  );
  if (found.length !== 1) return jsonError("Session not found.", 404);
  const status = found[0].status;

  const body = await readJson(request);
  const action = body?.action;

  if (action === "notes") {
    const notes = String(body?.progressNotes ?? "").trim();
    if (notes.length > SESSION_LIMITS.notes.max) {
      return jsonError("Notes can be at most 5000 characters.", 400);
    }
    await query("UPDATE mentorship_sessions SET progress_notes = $2 WHERE session_id = $1", [
      sessionId,
      notes || null,
    ]);
    return NextResponse.json({ saved: true });
  }

  // Every other action needs a session that is still scheduled.
  if (status !== "SCHEDULED") return jsonError(`This session is already ${status.toLowerCase()}.`, 409);

  if (action === "reschedule") {
    const date = futureDate(body?.scheduledDate);
    if (!date) return jsonError("Choose a date and time in the future.", 400);
    await query("UPDATE mentorship_sessions SET scheduled_date = $2 WHERE session_id = $1", [
      sessionId,
      date.toISOString(),
    ]);
    return NextResponse.json({ status: "SCHEDULED" });
  }
  if (action === "complete" || action === "cancel") {
    const newStatus = action === "complete" ? "COMPLETED" : "CANCELLED";
    await query("UPDATE mentorship_sessions SET status = $2 WHERE session_id = $1", [
      sessionId,
      newStatus,
    ]);
    return NextResponse.json({ status: newStatus });
  }
  return jsonError("Unknown action.", 400);
}
