import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FeedbackForm from "@/components/FeedbackForm";
import { formatDate } from "@/lib/format";
import { getSessionForUser } from "@/lib/mentorships";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Feedback" };

// Feedback on a completed session (Figure 4.10, FR-11).
export default async function StudentFeedbackPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { sessionId } = await params;
  const target = await getSessionForUser(sessionId, session.userId);
  if (!target) notFound();
  const returnPath = `/student/mentorships/${target.requestId}`;

  return (
    <AppShell session={session}>
      <Link href={returnPath} className="text-sm font-medium text-blue-800 hover:underline">
        ← Back
      </Link>
      <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Please provide feedback about your mentorship session.</h1>
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm">
          Session: {target.topic} with {target.otherName} — {formatDate(target.scheduledDate)}
        </p>
        {target.status !== "COMPLETED" ? (
          <p className="text-sm text-slate-700">Feedback can be given once the session is completed.</p>
        ) : target.feedbackGiven ? (
          <p className="text-sm text-green-700">You have already given feedback for this session. Thank you.</p>
        ) : (
          <FeedbackForm sessionId={target.sessionId} isStudent={target.isStudent} returnPath={returnPath} />
        )}
      </section>
    </AppShell>
  );
}
