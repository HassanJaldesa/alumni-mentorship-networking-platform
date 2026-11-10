// Fixed answer lists for the onboarding questionnaire.
// The order must match ml-service/app/vocabulary.py exactly, because each
// position becomes one element of the structured (multi-hot) vector.

export const INDUSTRIES = [
  "Software & IT",
  "Banking & Finance",
  "Fintech & Mobile Money",
  "Telecommunications",
  "Consulting",
  "Data & Analytics",
  "Cybersecurity",
  "Healthcare",
  "Energy & Utilities",
  "Education & Research",
] as const;

export const SKILLS = [
  "Python",
  "Java",
  "JavaScript",
  "SQL",
  "Data Analysis",
  "Machine Learning",
  "Cloud Computing",
  "Cybersecurity",
  "Networking",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "UI/UX Design",
  "Project Management",
  "Product Management",
  "Financial Analysis",
  "Accounting",
  "Business Strategy",
  "Public Speaking",
  "Leadership",
] as const;

export const MENTORSHIP_INTERESTS = [
  "Career Guidance",
  "Technical Skills",
  "Internships & Job Search",
  "CV & Interview Preparation",
  "Entrepreneurship",
  "Graduate Studies",
  "Leadership Development",
  "Industry Insights",
  "Professional Networking",
  "Work-Life Balance",
] as const;

export const AVAILABILITY = [
  "Weekday Mornings",
  "Weekday Evenings",
  "Weekends",
  "Flexible",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type Skill = (typeof SKILLS)[number];
export type MentorshipInterest = (typeof MENTORSHIP_INTERESTS)[number];
export type Availability = (typeof AVAILABILITY)[number];