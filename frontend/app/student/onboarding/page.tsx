import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import OnboardingForm from "@/components/OnboardingForm";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Onboarding Questionnaire" };

export default async function StudentOnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.userId);

  return (
    <AppShell session={session}>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <OnboardingForm role="STUDENT" initial={profile} homePath="/student" />
      </div>
    </AppShell>
  );
}
