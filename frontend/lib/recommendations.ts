import { query } from "@/lib/db";
import { callMlService } from "@/lib/mlService";

// One recommended mentor as shown to a student (FR-06, FR-07).
export interface RecommendedMentor {
  recommendationId: string;
  mentorId: string;
  rank: number;
  similarityScore: number;
  viewed: boolean;
  firstName: string;
  lastName: string;
  industry: string;
  yearsOfExperience: number | null;
  skills: string[];
  availability: string;
  sharedInterests: string[];
  availabilityMatch: boolean;
}

export interface RecommendationResult {
  items: RecommendedMentor[];
  // live: just generated; stored: service unavailable, last saved list shown (NFR-07)
  source: "live" | "stored" | "none";
  generatedAt: string | null;
  message: string | null;
}

interface Features {
  industry: string;
  skills: string[];
  mentorship_interests: string[];
  availability: string;
}

interface Row {
  recommendation_id: string;
  mentor_id: string;
  rank: number;
  similarity_score: number;
  viewed: boolean;
  generated_at: Date;
  first_name: string;
  last_name: string;
  years_of_experience: number | null;
  features: Features;
}

const UNAVAILABLE =
  "The recommendation service is unavailable right now, so your most recently saved recommendations are shown.";

export async function getStudentId(userId: string): Promise<string | null> {
  const rows = await query<{ student_id: string }>(
    "SELECT student_id FROM students WHERE user_id = $1",
    [userId],
  );
  return rows[0]?.student_id ?? null;
}

// The most recent list stored for this student. Lists are written in one
// transaction, so every row of a list has the same generated_at.
async function latestStoredList(studentId: string, studentUserId: string) {
  const [student] = await query<{ features: Features }>(
    "SELECT structured_features AS features FROM profiles WHERE user_id = $1",
    [studentUserId],
  );
  const rows = await query<Row>(
    `SELECT r.recommendation_id, r.mentor_id, r.rank, r.similarity_score, r.viewed, r.generated_at,
            u.first_name, u.last_name, m.years_of_experience, p.structured_features AS features
     FROM mentor_recommendations r
     JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
     JOIN users u ON u.user_id = m.user_id AND u.is_active
     JOIN profiles p ON p.user_id = m.user_id
     WHERE r.student_id = $1
       AND r.generated_at = (SELECT max(generated_at) FROM mentor_recommendations WHERE student_id = $1)
     ORDER BY r.rank`,
    [studentId],
  );
  const studentInterests = new Set(student?.features.mentorship_interests ?? []);

  const items = rows.map((row) => ({
    recommendationId: row.recommendation_id,
    mentorId: row.mentor_id,
    rank: row.rank,
    similarityScore: Number(row.similarity_score),
    viewed: row.viewed,
    firstName: row.first_name,
    lastName: row.last_name,
    industry: row.features.industry,
    yearsOfExperience: row.years_of_experience,
    skills: row.features.skills,
    availability: row.features.availability,
    sharedInterests: row.features.mentorship_interests.filter((i) => studentInterests.has(i)),
    availabilityMatch:
      row.features.availability === student?.features.availability ||
      row.features.availability === "Flexible" ||
      student?.features.availability === "Flexible",
  }));
  return { items, generatedAt: rows[0]?.generated_at.toISOString() ?? null };
}

// Asks the recommendation service for a fresh list each time the student opens
// their recommendations (Figure 4.1: View includes Generate). If the service
// cannot be reached, the last stored list is shown instead (NFR-07).
export async function loadRecommendations(
  studentUserId: string,
  studentId: string,
): Promise<RecommendationResult> {
  let serviceMessage: string | null = null;
  let live = false;
  try {
    const response = await callMlService(`/recommendations/${studentUserId}`, {
      method: "POST",
      timeoutMs: 5000,
    });
    if (response.ok) {
      const body = await response.json();
      if (body.recommendations.length === 0) {
        return { items: [], source: "none", generatedAt: null, message: body.message };
      }
      live = true;
    } else {
      console.error("Recommendation request failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Recommendation service unreachable:", error);
  }

  const stored = await latestStoredList(studentId, studentUserId);
  if (live) {
    return { items: stored.items, source: "live", generatedAt: stored.generatedAt, message: null };
  }
  if (stored.items.length > 0) {
    serviceMessage = UNAVAILABLE;
    return { items: stored.items, source: "stored", generatedAt: stored.generatedAt, message: serviceMessage };
  }
  return {
    items: [],
    source: "none",
    generatedAt: null,
    message: "Recommendations are unavailable right now. Please try again later.",
  };
}
