import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ProfileSummary from "@/components/ProfileSummary";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // New users must complete onboarding first (FR-03).
  const profile = await getProfile(session.userId);
  if (!profile) redirect("/student/onboarding");

  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session.firstName}</h1>
          <p className="mt-1 text-slate-600">Mentor recommendations will appear here.</p>
        </div>
        <ProfileSummary profile={profile} isStudent={true} editPath="/student/onboarding" />
      </main>
    </div>
  );
}