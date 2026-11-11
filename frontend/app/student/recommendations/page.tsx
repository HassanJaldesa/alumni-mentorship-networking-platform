import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import RecommendationList from "@/components/RecommendationList";
import { getProfile } from "@/lib/profile";
import { getStudentId, loadRecommendations } from "@/lib/recommendations";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentor Recommendations" };

export default async function RecommendationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await getProfile(session.userId))) redirect("/student/onboarding");
  const studentId = await getStudentId(session.userId);
  if (!studentId) redirect("/login");

  const result = await loadRecommendations(session.userId, studentId);

  return (
    <AppShell session={session}>
      <div>
        <h1 className="text-2xl font-bold">Mentor Recommendations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Mentors who match your industry, mentorship interests and availability, ranked by how
          closely their profile matches yours.
        </p>
      </div>
      <RecommendationList result={result} />
    </AppShell>
  );
}
