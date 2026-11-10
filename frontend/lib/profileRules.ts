// Limits and options shared by the onboarding form and the profile API.
// Safe to use in the browser (no server-only imports).

export const YEARS_OF_STUDY = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Postgraduate",
] as const;

export const LIMITS = {
  biography: { min: 30, max: 2000 },
  careerGoals: { min: 20, max: 1000 },
  academicBackground: { max: 150 },
  yearsOfExperience: { min: 0, max: 60 },
  maxMentees: { min: 1, max: 10 },
} as const;