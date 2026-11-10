import { query } from "@/lib/db";

// One user's saved onboarding answers (FR-02 to FR-05).
export interface ProfileData {
  industry: string;
  skills: string[];
  mentorshipInterests: string[];
  availability: string;
  biography: string;
  careerGoals: string;
  academicBackground: string; // students only
  yearOfStudy: string; // students only
  yearsOfExperience: number | null; // mentors only
  maxMentees: number | null; // mentors only
  lastUpdated: string;
  vectorsUpToDate: boolean; // false if the latest answers have not been embedded yet
}

interface ProfileRow {
  features: {
    industry?: string;
    skills?: string[];
    mentorship_interests?: string[];
    availability?: string;
  } | null;
  biography: string | null;
  career_goals: string | null;
  last_updated: Date;
  vectors_up_to_date: boolean;
  academic_background: string | null;
  year_of_study: string | null;
  years_of_experience: number | null;
  max_mentees: number | null;
}

// Returns null when the user has not completed onboarding yet (FR-03).
export async function getProfile(userId: string): Promise<ProfileData | null> {
  const rows = await query<ProfileRow>(
    `SELECT p.structured_features AS features, p.biography, p.career_goals, p.last_updated,
            COALESCE(v.generated_at >= p.last_updated, false) AS vectors_up_to_date,
            s.academic_background, s.year_of_study,
            m.years_of_experience, m.max_mentees
     FROM profiles p
     LEFT JOIN profile_vectors v ON v.profile_id = p.profile_id
     LEFT JOIN students s ON s.user_id = p.user_id
     LEFT JOIN alumni_mentors m ON m.user_id = p.user_id
     WHERE p.user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;

  return {
    industry: row.features?.industry ?? "",
    skills: row.features?.skills ?? [],
    mentorshipInterests: row.features?.mentorship_interests ?? [],
    availability: row.features?.availability ?? "",
    biography: row.biography ?? "",
    careerGoals: row.career_goals ?? "",
    academicBackground: row.academic_background ?? "",
    yearOfStudy: row.year_of_study ?? "",
    yearsOfExperience: row.years_of_experience,
    maxMentees: row.max_mentees,
    lastUpdated: row.last_updated.toISOString(),
    vectorsUpToDate: row.vectors_up_to_date,
  };
}