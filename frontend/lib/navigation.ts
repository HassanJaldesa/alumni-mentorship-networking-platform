import type { Role } from "@/lib/session";

export interface NavItem {
  label: string;
  href: string;
}

// Each role sees only the functions it can use (IR-01).
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student" },
    { label: "Recommendations", href: "/student/recommendations" },
    { label: "Mentorships", href: "/student/mentorships" },
    { label: "Profile", href: "/student/profile" },
  ],
  ALUMNI_MENTOR: [
    { label: "Dashboard", href: "/mentor" },
    { label: "Mentorships", href: "/mentor/mentorships" },
    { label: "Profile", href: "/mentor/profile" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Reports", href: "/admin/reports" },
  ],
};
