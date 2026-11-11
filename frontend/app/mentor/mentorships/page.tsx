import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MentorshipList from "@/components/MentorshipList";
import { listMentorMentorships } from "@/lib/mentorships";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentorships" };

// Mentorship management (Figure 4.9, FR-08 to FR-10).
export default async function MentorMentorshipsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const items = await listMentorMentorships(session.userId);

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold">Mentorships</h1>
      <MentorshipList items={items} isMentor={true} basePath="/mentor/mentorships" />
    </AppShell>
  );
}
