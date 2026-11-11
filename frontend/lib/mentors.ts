import { query } from "@/lib/db";

// Everything shown on a mentor's profile page (FR-07, Figure 4.8).
export interface MentorDetails {
  mentorId: string;
  userId: string;
  firstName: string;
  lastName: string;
  industry: string;
  yearsOfExperience: number | null;
  skills: string[];
  interests: string[];
  availability: string;
  biography: string;
  mentoringFocus: string;
  maxMentees: number;
  activeMentees: number;
}

export async function getMentorDetails(mentorId: string): Promise<MentorDetails | null> {
  // Reject anything that is not a UUID before it reaches the database.
  if (!/^[0-9a-f-]{36}$/i.test(mentorId)) return null;
  const rows = await query<{
    mentor_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    years_of_experience: number | null;
    max_mentees: number;
    features: { industry: string; skills: string[]; mentorship_interests: string[]; availability: string };
    biography: string | null;
    career_goals: string | null;
    active_mentees: string;
  }>(
    `SELECT m.mentor_id, m.user_id, u.first_name, u.last_name, m.years_of_experience, m.max_mentees,
            p.structured_features AS features, p.biography, p.career_goals,
            (SELECT count(*) FROM mentorship_requests r
             WHERE r.mentor_id = m.mentor_id AND r.status = 'ACCEPTED') AS active_mentees
     FROM alumni_mentors m
     JOIN users u ON u.user_id = m.user_id AND u.is_active
     JOIN profiles p ON p.user_id = m.user_id
     WHERE m.mentor_id = $1`,
    [mentorId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    mentorId: row.mentor_id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    industry: row.features.industry,
    yearsOfExperience: row.years_of_experience,
    skills: row.features.skills,
    interests: row.features.mentorship_interests,
    availability: row.features.availability,
    biography: row.biography ?? "",
    mentoringFocus: row.career_goals ?? "",
    maxMentees: row.max_mentees,
    activeMentees: Number(row.active_mentees),
  };
}

// Records that the student opened a recommended mentor's profile. This is the
// click-through measure in the FR-13 reports.
export async function markRecommendationViewed(studentId: string, mentorId: string) {
  await query(
    "UPDATE mentor_recommendations SET viewed = true WHERE student_id = $1 AND mentor_id = $2",
    [studentId, mentorId],
  );
}
