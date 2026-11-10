import type { Role } from "@/lib/session";

// Where each role lands after logging in.
export const HOME_BY_ROLE: Record<Role, string> = {
  STUDENT: "/student",
  ALUMNI_MENTOR: "/mentor",
  ADMIN: "/admin",
};