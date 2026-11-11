import { query } from "@/lib/db";

export interface StudentCounts {
  pending: number;
  active: number;
  completedSessions: number;
}

export interface MentorCounts {
  pending: number;
  active: number;
  maxMentees: number;
  completedSessions: number;
}

export async function getStudentCounts(studentId: string): Promise<StudentCounts> {
  const [row] = await query<{ pending: string; active: string; completed: string }>(
    `SELECT
       (SELECT count(*) FROM mentorship_requests WHERE student_id = $1 AND status = 'PENDING') AS pending,
       (SELECT count(*) FROM mentorship_requests WHERE student_id = $1 AND status = 'ACCEPTED') AS active,
       (SELECT count(*) FROM mentorship_sessions s
          JOIN mentorship_requests r ON r.request_id = s.request_id
        WHERE r.student_id = $1 AND s.status = 'COMPLETED') AS completed`,
    [studentId],
  );
  return {
    pending: Number(row.pending),
    active: Number(row.active),
    completedSessions: Number(row.completed),
  };
}

export async function getMentorCounts(userId: string): Promise<MentorCounts> {
  const [row] = await query<{ pending: string; active: string; max_mentees: number; completed: string }>(
    `SELECT m.max_mentees,
       (SELECT count(*) FROM mentorship_requests r WHERE r.mentor_id = m.mentor_id AND r.status = 'PENDING') AS pending,
       (SELECT count(*) FROM mentorship_requests r WHERE r.mentor_id = m.mentor_id AND r.status = 'ACCEPTED') AS active,
       (SELECT count(*) FROM mentorship_sessions s
          JOIN mentorship_requests r ON r.request_id = s.request_id
        WHERE r.mentor_id = m.mentor_id AND s.status = 'COMPLETED') AS completed
     FROM alumni_mentors m WHERE m.user_id = $1`,
    [userId],
  );
  return {
    pending: Number(row?.pending ?? 0),
    active: Number(row?.active ?? 0),
    maxMentees: row?.max_mentees ?? 0,
    completedSessions: Number(row?.completed ?? 0),
  };
}
