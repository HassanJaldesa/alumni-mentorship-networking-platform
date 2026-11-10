import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requestProfileVectors } from "@/lib/mlService";
import { LIMITS, YEARS_OF_STUDY } from "@/lib/profileRules";
import { getSession } from "@/lib/session";
import { AVAILABILITY, INDUSTRIES, MENTORSHIP_INTERESTS, SKILLS } from "@/lib/vocabulary";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Returns the list if every item is a string from the allowed list, otherwise null.
function pickFromList(value: unknown, allowed: readonly string[]): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = [...new Set(value)];
  return items.every((item) => typeof item === "string" && allowed.includes(item))
    ? (items as string[])
    : null;
}

function wholeNumber(value: unknown, min: number, max: number): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

// Saves the onboarding questionnaire (FR-02 to FR-05), then asks the
// recommendation service to rebuild the profile vectors (DR-03).
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  if (session.role === "ADMIN") {
    return NextResponse.json(
      { error: "Administrators do not have a mentorship profile." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body.");
  }

  // 1. Validate the shared answers (DR-02: values must come from the predefined lists).
  const industry = String(body.industry ?? "");
  const availability = String(body.availability ?? "");
  const skills = pickFromList(body.skills, SKILLS);
  const interests = pickFromList(body.mentorshipInterests, MENTORSHIP_INTERESTS);
  const biography = String(body.biography ?? "").trim();
  const careerGoals = String(body.careerGoals ?? "").trim();

  if (!INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
    return badRequest("Select an industry from the list.");
  }
  if (!skills || skills.length === 0) {
    return badRequest("Select at least one skill from the list.");
  }
  if (!interests || interests.length === 0) {
    return badRequest("Select at least one mentorship interest.");
  }
  if (!AVAILABILITY.includes(availability as (typeof AVAILABILITY)[number])) {
    return badRequest("Select your availability.");
  }
  if (biography.length < LIMITS.biography.min || biography.length > LIMITS.biography.max) {
    return badRequest(
      `Biography must be ${LIMITS.biography.min} to ${LIMITS.biography.max} characters.`,
    );
  }
  if (careerGoals.length < LIMITS.careerGoals.min || careerGoals.length > LIMITS.careerGoals.max) {
    return badRequest(
      `The goals box must be ${LIMITS.careerGoals.min} to ${LIMITS.careerGoals.max} characters.`,
    );
  }

  // 2. Validate the role-specific answers.
  const academicBackground = String(body.academicBackground ?? "").trim();
  const yearOfStudy = String(body.yearOfStudy ?? "");
  const yearsOfExperience = wholeNumber(
    body.yearsOfExperience,
    LIMITS.yearsOfExperience.min,
    LIMITS.yearsOfExperience.max,
  );
  const maxMentees = wholeNumber(body.maxMentees, LIMITS.maxMentees.min, LIMITS.maxMentees.max);

  if (session.role === "STUDENT") {
    if (!academicBackground || academicBackground.length > LIMITS.academicBackground.max) {
      return badRequest("Enter your programme of study, for example BSc Computer Science.");
    }
    if (!YEARS_OF_STUDY.includes(yearOfStudy as (typeof YEARS_OF_STUDY)[number])) {
      return badRequest("Select your year of study.");
    }
  } else {
    if (yearsOfExperience === null) {
      return badRequest("Years of experience must be a whole number from 0 to 60.");
    }
    if (maxMentees === null) {
      return badRequest("Maximum mentees must be a whole number from 1 to 10.");
    }
  }

  // 3. Save everything in one transaction.
  const structuredFeatures = { industry, skills, mentorship_interests: interests, availability };
  const bioText = `${biography}\n\n${careerGoals}`; // the text SBERT embeds
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const roleUpdate =
      session.role === "STUDENT"
        ? await client.query(
            `UPDATE students
             SET academic_background = $2, year_of_study = $3, career_interests = $4,
                 mentorship_preferences = $5
             WHERE user_id = $1`,
            [
              session.userId,
              academicBackground,
              yearOfStudy,
              careerGoals,
              JSON.stringify({ industry, mentorship_interests: interests, availability }),
            ],
          )
        : await client.query(
            `UPDATE alumni_mentors
             SET industry = $2, years_of_experience = $3, skills = $4, mentorship_interests = $5,
                 availability = $6, max_mentees = $7, profile_bio = $8
             WHERE user_id = $1`,
            [
              session.userId,
              industry,
              yearsOfExperience,
              skills.join(", "),
              interests.join(", "),
              availability,
              maxMentees,
              biography,
            ],
          );
    if (roleUpdate.rowCount !== 1) {
      throw new Error(`No ${session.role} record found for user ${session.userId}`);
    }

    await client.query(
      `INSERT INTO profiles (user_id, structured_features, bio_text, biography, career_goals, last_updated)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id) DO UPDATE SET
         structured_features = EXCLUDED.structured_features,
         bio_text = EXCLUDED.bio_text,
         biography = EXCLUDED.biography,
         career_goals = EXCLUDED.career_goals,
         last_updated = now()`,
      [session.userId, JSON.stringify(structuredFeatures), bioText, biography, careerGoals],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Saving profile failed:", error);
    return NextResponse.json(
      { error: "Your profile could not be saved. Please try again." },
      { status: 500 },
    );
  } finally {
    client.release();
  }

  // 4. Rebuild the vectors. The profile stays saved even if this fails.
  const vectorsGenerated = await requestProfileVectors(session.userId);
  return NextResponse.json({ saved: true, vectorsGenerated });
}