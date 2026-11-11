import AppHeader from "@/components/AppHeader";
import NavLinks from "@/components/NavLinks";
import { NAV_BY_ROLE } from "@/lib/navigation";
import type { SessionPayload } from "@/lib/session";

// Page frame after login: top bar, role-specific menu and page content.
// The menu sits on the left on wide screens and across the top on phones.
export default function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <NavLinks items={NAV_BY_ROLE[session.role]} />
        </aside>
        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
