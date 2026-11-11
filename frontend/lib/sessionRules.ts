// Limits shared by the session forms and the session API routes.
export const SESSION_LIMITS = {
  topic: { min: 3, max: 200 },
  duration: { min: 15, max: 240 },
  notes: { max: 5000 },
} as const;

// Returns a Date if the value is a valid date in the future, otherwise null.
export function futureDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getTime() <= Date.now() ? null : date;
}
