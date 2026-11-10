import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import OnboardingForm from "@/components/OnboardingForm";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Onboarding Questionnaire" };

export default async function MentorOnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.userId);

  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <OnboardingForm role="ALUMNI_MENTOR" initial={profile} homePath="/mentor" />
        </div>
      </main>
    </div>
  );
}