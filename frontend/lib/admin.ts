import { query } from "@/lib/db";

// Synthetic test accounts (DR-04) are left out of reports unless asked for.
export const SYNTHETIC_PATTERN = "%@synthetic.test";

export interface Overview {
  students: number;
  mentors: number;
  admins: number;
  activeMentorships: number;
  completedSessions: number;
  pendingRequests: number;
}

export async function getOverview(): Promise<Overview> {
  const [row] = await query<Record<keyof Overview, string>>(
    `SELECT
       (SELECT count(*) FROM users WHERE role = 'STUDENT') AS students,
       (SELECT count(*) FROM users WHERE role = 'ALUMNI_MENTOR') AS mentors,
       (SELECT count(*) FROM users WHERE role = 'ADMIN') AS admins,
       (SELECT count(*) FROM mentorship_requests WHERE status = 'ACCEPTED') AS "activeMentorships",
       (SELECT count(*) FROM mentorship_sessions WHERE status = 'COMPLETED') AS "completedSessions",
       (SELECT count(*) FROM mentorship_requests WHERE status = 'PENDING') AS "pendingRequests"`,
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)])) as unknown as Overview;
}

export interface ActivityItem {
  at: string;
  text: string;
}

// The latest platform events for the "Recent Activity" panel (FR-12).
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const rows = await query<{ at: Date; text: string }>(
    `SELECT at, text FROM (
       SELECT created_at AS at,
              first_name || ' ' || last_name || ' registered as ' ||
              CASE role WHEN 'STUDENT' THEN 'a student' WHEN 'ALUMNI_MENTOR' THEN 'an alumni mentor'
                        ELSE 'an administrator' END AS text
       FROM users
       UNION ALL
       SELECT r.request_date, su.first_name || ' ' || su.last_name || ' sent a mentorship request to ' ||
              mu.first_name || ' ' || mu.last_name
       FROM mentorship_requests r
       JOIN students st ON st.student_id = r.student_id JOIN users su ON su.user_id = st.user_id
       JOIN alumni_mentors m ON m.mentor_id = r.mentor_id JOIN users mu ON mu.user_id = m.user_id
       UNION ALL
       SELECT r.response_date, mu.first_name || ' ' || mu.last_name ||
              CASE r.status WHEN 'ACCEPTED' THEN ' accepted ' ELSE ' declined ' END ||
              su.first_name || ' ' || su.last_name || '''s request'
       FROM mentorship_requests r
       JOIN students st ON st.student_id = r.student_id JOIN users su ON su.user_id = st.user_id
       JOIN alumni_mentors m ON m.mentor_id = r.mentor_id JOIN users mu ON mu.user_id = m.user_id
       WHERE r.response_date IS NOT NULL
       UNION ALL
       SELECT f.submitted_at, u.first_name || ' ' || u.last_name || ' submitted session feedback'
       FROM feedback f JOIN users u ON u.user_id = f.user_id
     ) events
     ORDER BY at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({ at: r.at.toISOString(), text: r.text }));
}

export interface UserRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  onboarded: boolean;
}

export async function listUsers(role: string | null, search: string | null): Promise<UserRow[]> {
  const rows = await query<{
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: Date;
    onboarded: boolean;
  }>(
    `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.is_active, u.created_at,
            EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.user_id) AS onboarded
     FROM users u
     WHERE ($1::text IS NULL OR u.role = $1)
       AND ($2::text IS NULL OR u.first_name || ' ' || u.last_name || ' ' || u.email ILIKE '%' || $2 || '%')
     ORDER BY u.created_at DESC
     LIMIT 200`,
    [role, search],
  );
  return rows.map((r) => ({
    userId: r.user_id,
    name: `${r.first_name} ${r.last_name}`,
    email: r.email,
    role: r.role,
    isActive: r.is_active,
    createdAt: r.created_at.toISOString(),
    onboarded: r.onboarded,
  }));
}

// ---------- FR-13 reports ----------

export interface Metric {
  key: string;
  title: string;
  value: number | null; // a rate from 0 to 1, or a mean rating from 1 to 5
  kind: "rate" | "rating";
  numerator: number | null;
  denominator: number;
  note: string;
  target?: string;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

// All six FR-13 measures, in anonymized aggregate form (DR-06).
export async function getReports(includeSynthetic: boolean): Promise<Metric[]> {
  const exclude = includeSynthetic ? null : SYNTHETIC_PATTERN;
  const [r] = await query<Record<string, string | null>>(
    `WITH included AS (
       SELECT user_id, role FROM users
       WHERE role <> 'ADMIN' AND ($1::text IS NULL OR email NOT LIKE $1)
     ),
     st AS (SELECT s.student_id FROM students s JOIN included i ON i.user_id = s.user_id
            WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = s.user_id)),
     me AS (SELECT m.mentor_id FROM alumni_mentors m JOIN included i ON i.user_id = m.user_id
            WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = m.user_id)),
     recs AS (SELECT * FROM mentor_recommendations WHERE student_id IN (SELECT student_id FROM st)),
     reqs AS (SELECT * FROM mentorship_requests WHERE student_id IN (SELECT student_id FROM st)),
     sess AS (SELECT s.* FROM mentorship_sessions s JOIN reqs r ON r.request_id = s.request_id),
     fb AS (SELECT f.*, i.role FROM feedback f JOIN included i ON i.user_id = f.user_id
            WHERE f.session_id IN (SELECT session_id FROM sess))
     SELECT
       (SELECT avg(relevance_rating) FROM fb WHERE role = 'STUDENT') AS relevance_mean,
       (SELECT count(*) FROM fb WHERE role = 'STUDENT') AS relevance_n,
       (SELECT avg(relevance_rating) FROM fb WHERE role = 'ALUMNI_MENTOR') AS mentor_match_mean,
       (SELECT count(*) FROM fb WHERE role = 'ALUMNI_MENTOR') AS mentor_match_n,
       (SELECT count(*) FROM recs) AS recs_total,
       (SELECT count(*) FROM recs WHERE viewed) AS recs_viewed,
       (SELECT count(*) FROM reqs WHERE recommendation_id IS NOT NULL) AS reqs_from_recs,
       (SELECT count(*) FROM st) AS students,
       (SELECT count(DISTINCT student_id) FROM reqs WHERE status = 'ACCEPTED') AS students_mentored,
       (SELECT count(*) FROM me) AS mentors,
       (SELECT count(DISTINCT mentor_id) FROM reqs WHERE status = 'ACCEPTED'
          AND mentor_id IN (SELECT mentor_id FROM me)) AS mentors_active,
       (SELECT count(*) FROM sess WHERE status = 'COMPLETED') AS sessions_completed,
       (SELECT count(*) FROM sess WHERE status IN ('COMPLETED', 'CANCELLED')) AS sessions_closed,
       (SELECT count(*) FROM reqs WHERE status = 'ACCEPTED') AS mentorships,
       (SELECT count(*) FROM reqs r WHERE status = 'ACCEPTED' AND EXISTS
          (SELECT 1 FROM sess s WHERE s.request_id = r.request_id AND s.status = 'COMPLETED'))
          AS mentorships_with_completed,
       (SELECT avg(satisfaction_score) FROM fb) AS satisfaction_mean,
       (SELECT count(*) FROM fb) AS satisfaction_n,
       (SELECT avg(satisfaction_score) FROM fb WHERE role = 'STUDENT') AS satisfaction_students,
       (SELECT avg(satisfaction_score) FROM fb WHERE role = 'ALUMNI_MENTOR') AS satisfaction_mentors`,
    [exclude],
  );
  const n = (key: string) => Number(r[key] ?? 0);
  const mean = (key: string) => (r[key] === null ? null : Number(r[key]));
  const fmt = (value: number | null) => (value === null ? "no ratings yet" : value.toFixed(2));

  return [
    {
      key: "recommendation_relevance",
      title: "Recommendation relevance",
      value: mean("relevance_mean"),
      kind: "rating",
      numerator: null,
      denominator: n("relevance_n"),
      note: `Mean of students' relevance ratings (1-5). Mentors' rating of the match: ${fmt(mean("mentor_match_mean"))} (n = ${n("mentor_match_n")}).`,
      target: "NFR-09 target: at least 3.5",
    },
    {
      key: "click_through_rate",
      title: "Mentor profile click-through rate",
      value: rate(n("recs_viewed"), n("recs_total")),
      kind: "rate",
      numerator: n("recs_viewed"),
      denominator: n("recs_total"),
      note: "Recommended mentors whose profile the student opened, out of all mentors recommended.",
    },
    {
      key: "request_rate",
      title: "Mentor request rate",
      value: rate(n("reqs_from_recs"), n("recs_total")),
      kind: "rate",
      numerator: n("reqs_from_recs"),
      denominator: n("recs_total"),
      note: "Recommended mentors who received a mentorship request from the student, out of all mentors recommended.",
    },
    {
      key: "participation",
      title: "Mentorship participation",
      value: rate(n("students_mentored"), n("students")),
      kind: "rate",
      numerator: n("students_mentored"),
      denominator: n("students"),
      note: `Onboarded students with at least one accepted mentorship. Mentors with at least one mentee: ${n("mentors_active")} of ${n("mentors")}.`,
    },
    {
      key: "completion",
      title: "Mentorship completion",
      value: rate(n("sessions_completed"), n("sessions_closed")),
      kind: "rate",
      numerator: n("sessions_completed"),
      denominator: n("sessions_closed"),
      note: `Sessions completed out of sessions completed or cancelled. Accepted mentorships with at least one completed session: ${n("mentorships_with_completed")} of ${n("mentorships")}.`,
    },
    {
      key: "satisfaction",
      title: "User satisfaction",
      value: mean("satisfaction_mean"),
      kind: "rating",
      numerator: null,
      denominator: n("satisfaction_n"),
      note: `Mean satisfaction score (1-5) from all feedback. Students: ${fmt(mean("satisfaction_students"))}; mentors: ${fmt(mean("satisfaction_mentors"))}.`,
    },
  ];
}
