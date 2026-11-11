import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import RecommendationList from "@/components/RecommendationList";
import StatCard from "@/components/StatCard";
import { getStudentCounts } from "@/lib/dashboard";
import { getProfile } from "@/lib/profile";
import { getStudentId, loadRecommendations } from "@/lib/recommendations";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Student Dashboard" };

// Student dashboard (Figure 4.7, FR-06, FR-07).
export default async function StudentHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // New users must complete onboarding first (FR-03).
  const profile = await getProfile(session.userId);
  if (!profile) redirect("/student/onboarding");

  const studentId = await getStudentId(session.userId);
  if (!studentId) redirect("/login");
  const [result, counts] = await Promise.all([
    loadRecommendations(session.userId, studentId),
    getStudentCounts(studentId),
  ]);

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold">Welcome, {session.firstName}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={result.items.length} label="Recommended Mentors" />
        <StatCard value={counts.pending} label="Pending Requests" />
        <StatCard value={counts.active} label="Active Mentorships" />
        <StatCard value={counts.completedSessions} label="Completed Sessions" />
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Top Mentor Recommendations</h2>
          <Link
            href="/student/recommendations"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            View All
          </Link>
        </div>
        <RecommendationList result={result} limit={3} />
      </section>
    </AppShell>
  );
}
