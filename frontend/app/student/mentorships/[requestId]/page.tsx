import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MentorshipDetail from "@/components/MentorshipDetail";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentorship" };

export default async function StudentMentorshipPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { requestId } = await params;

  return (
    <AppShell session={session}>
      <MentorshipDetail session={session} requestId={requestId} basePath="/student" />
    </AppShell>
  );
}
