import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentor Dashboard" };

// Placeholder home page. Replaced by the dashboard in Step 9.
export default async function MentorHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Welcome, {session.firstName}</h1>
        <p className="mt-2 text-slate-600">Your onboarding questionnaire and mentorship requests will appear here.</p>
      </main>
    </div>
  );
}