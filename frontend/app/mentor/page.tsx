import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MentorshipList from "@/components/MentorshipList";
import StatCard from "@/components/StatCard";
import { getMentorCounts } from "@/lib/dashboard";
import { listMentorMentorships } from "@/lib/mentorships";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentor Dashboard" };

export default async function MentorHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // New users must complete onboarding first (FR-03).
  const profile = await getProfile(session.userId);
  if (!profile) redirect("/mentor/onboarding");
  const [counts, items] = await Promise.all([
    getMentorCounts(session.userId),
    listMentorMentorships(session.userId),
  ]);

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold">Welcome, {session.firstName}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={counts.pending} label="Pending Requests" />
        <StatCard value={counts.active} label="Active Mentees" />
        <StatCard value={Math.max(0, counts.maxMentees - counts.active)} label="Places Available" />
        <StatCard value={counts.completedSessions} label="Completed Sessions" />
      </div>
      <MentorshipList items={items} isMentor basePath="/mentor/mentorships" pendingOnly />
    </AppShell>
  );
}
