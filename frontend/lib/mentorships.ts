import { query } from "@/lib/db";
import type { Role } from "@/lib/session";

export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

// One mentorship request seen from either side (FR-08, FR-09).
export interface MentorshipSummary {
  requestId: string;
  status: RequestStatus;
  message: string | null;
  requestDate: string;
  responseDate: string | null;
  otherName: string; // the mentor for a student, the student for a mentor
  otherDetail: string; // mentor's industry, or student's programme
  mentorId: string;
  completedSessions: number;
  nextSession: string | null;
}

interface SummaryRow {
  request_id: string;
  status: RequestStatus;
  message: string | null;
  request_date: Date;
  response_date: Date | null;
  first_name: string;
  last_name: string;
  detail: string | null;
  mentor_id: string;
  completed: string;
  next_session: Date | null;
}

const SESSION_COLUMNS = `
  (SELECT count(*) FROM mentorship_sessions s
   WHERE s.request_id = r.request_id AND s.status = 'COMPLETED') AS completed,
  (SELECT min(s.scheduled_date) FROM mentorship_sessions s
   WHERE s.request_id = r.request_id AND s.status = 'SCHEDULED' AND s.scheduled_date >= now()) AS next_session`;

function toSummary(row: SummaryRow): MentorshipSummary {
  return {
    requestId: row.request_id,
    status: row.status,
    message: row.message,
    requestDate: row.request_date.toISOString(),
    responseDate: row.response_date?.toISOString() ?? null,
    otherName: `${row.first_name} ${row.last_name}`,
    otherDetail: row.detail ?? "",
    mentorId: row.mentor_id,
    completedSessions: Number(row.completed),
    nextSession: row.next_session?.toISOString() ?? null,
  };
}

export async function listStudentMentorships(studentUserId: string): Promise<MentorshipSummary[]> {
  const rows = await query<SummaryRow>(
    `SELECT r.request_id, r.status, r.message, r.request_date, r.response_date, r.mentor_id,
            u.first_name, u.last_name, m.industry AS detail, ${SESSION_COLUMNS}
     FROM mentorship_requests r
     JOIN students st ON st.student_id = r.student_id
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     JOIN users u ON u.user_id = m.user_id
     WHERE st.user_id = $1
     ORDER BY r.request_date DESC`,
    [studentUserId],
  );
  return rows.map(toSummary);
}

export async function listMentorMentorships(mentorUserId: string): Promise<MentorshipSummary[]> {
  const rows = await query<SummaryRow>(
    `SELECT r.request_id, r.status, r.message, r.request_date, r.response_date, r.mentor_id,
            u.first_name, u.last_name,
            st.academic_background || ' (' || st.year_of_study || ')' AS detail, ${SESSION_COLUMNS}
     FROM mentorship_requests r
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     JOIN students st ON st.student_id = r.student_id
     JOIN users u ON u.user_id = st.user_id
     WHERE m.user_id = $1
     ORDER BY r.request_date DESC`,
    [mentorUserId],
  );
  return rows.map(toSummary);
}

// Which side of this mentorship the user is on, or null if they are not part of it.
export async function getParticipantRole(
  userId: string,
  requestId: string,
): Promise<{ role: Role; status: RequestStatus } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return null;
  const rows = await query<{ student_user: string; mentor_user: string; status: RequestStatus }>(
    `SELECT st.user_id AS student_user, m.user_id AS mentor_user, r.status
     FROM mentorship_requests r
     JOIN students st ON st.student_id = r.student_id
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     WHERE r.request_id = $1`,
    [requestId],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.student_user === userId) return { role: "STUDENT", status: row.status };
  if (row.mentor_user === userId) return { role: "ALUMNI_MENTOR", status: row.status };
  return null;
}

export interface SessionItem {
  sessionId: string;
  topic: string;
  scheduledDate: string;
  duration: number | null;
  progressNotes: string;
  status: SessionStatus;
  myFeedbackGiven: boolean;
}

export async function listSessions(requestId: string, userId: string): Promise<SessionItem[]> {
  const rows = await query<{
    session_id: string;
    topic: string | null;
    scheduled_date: Date;
    duration: number | null;
    progress_notes: string | null;
    status: SessionStatus;
    feedback_given: boolean;
  }>(
    `SELECT s.session_id, s.topic, s.scheduled_date, s.duration, s.progress_notes, s.status,
            EXISTS (SELECT 1 FROM feedback f WHERE f.session_id = s.session_id AND f.user_id = $2)
              AS feedback_given
     FROM mentorship_sessions s
     WHERE s.request_id = $1
     ORDER BY s.scheduled_date`,
    [requestId, userId],
  );
  return rows.map((row) => ({
    sessionId: row.session_id,
    topic: row.topic ?? "",
    scheduledDate: row.scheduled_date.toISOString(),
    duration: row.duration,
    progressNotes: row.progress_notes ?? "",
    status: row.status,
    myFeedbackGiven: row.feedback_given,
  }));
}

// A session together with the mentorship it belongs to, for the feedback page.
export async function getSessionForUser(sessionId: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const rows = await query<{
    session_id: string;
    request_id: string;
    topic: string | null;
    scheduled_date: Date;
    status: SessionStatus;
    student_user: string;
    mentor_user: string;
    student_name: string;
    mentor_name: string;
    feedback_given: boolean;
  }>(
    `SELECT s.session_id, s.request_id, s.topic, s.scheduled_date, s.status,
            st.user_id AS student_user, m.user_id AS mentor_user,
            su.first_name || ' ' || su.last_name AS student_name,
            mu.first_name || ' ' || mu.last_name AS mentor_name,
            EXISTS (SELECT 1 FROM feedback f WHERE f.session_id = s.session_id AND f.user_id = $2)
              AS feedback_given
     FROM mentorship_sessions s
     JOIN mentorship_requests r ON r.request_id = s.request_id
     JOIN students st ON st.student_id = r.student_id
     JOIN users su ON su.user_id = st.user_id
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     JOIN users mu ON mu.user_id = m.user_id
     WHERE s.session_id = $1`,
    [sessionId, userId],
  );
  const row = rows[0];
  if (!row || (row.student_user !== userId && row.mentor_user !== userId)) return null;
  const isStudent = row.student_user === userId;
  return {
    sessionId: row.session_id,
    requestId: row.request_id,
    topic: row.topic ?? "",
    scheduledDate: row.scheduled_date.toISOString(),
    status: row.status,
    isStudent,
    otherName: isStudent ? row.mentor_name : row.student_name,
    feedbackGiven: row.feedback_given,
  };
}
