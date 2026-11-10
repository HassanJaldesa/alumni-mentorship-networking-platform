import LogoutButton from "@/components/LogoutButton";
import type { Role, SessionPayload } from "@/lib/session";

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  ALUMNI_MENTOR: "Alumni Mentor",
  ADMIN: "Administrator",
};

// Top bar shown on every page after login.
export default function AppHeader({ session }: { session: SessionPayload }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-800 text-sm font-bold text-white">
            AM
          </span>
          <span className="hidden font-semibold sm:inline">
            Alumni Mentorship and Networking Platform
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {session.firstName}{" "}
            <span className="text-slate-500">({ROLE_LABELS[session.role]})</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}