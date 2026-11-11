import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProfileSummary from "@/components/ProfileSummary";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "My Profile" };

// View your own profile (FR-02).
export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.userId);
  if (!profile) redirect("/student/onboarding");

  return (
    <AppShell session={session}>
      <ProfileSummary profile={profile} isStudent={true} editPath="/student/onboarding" />
    </AppShell>
  );
}
