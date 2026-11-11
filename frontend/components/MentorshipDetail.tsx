import Link from "next/link";
import { notFound } from "next/navigation";
import SessionCard from "@/components/SessionCard";
import SessionScheduler from "@/components/SessionScheduler";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getParticipantRole,
  listMentorMentorships,
  listSessions,
  listStudentMentorships,
} from "@/lib/mentorships";
import type { SessionPayload } from "@/lib/session";

// One accepted mentorship: who it is with, its sessions and notes (Figure 4.9).
export default async function MentorshipDetail({
  session,
  requestId,
  basePath, // "/student" or "/mentor"
}: {
  session: SessionPayload;
  requestId: string;
  basePath: string;
}) {
  const participant = await getParticipantRole(session.userId, requestId);
  if (!participant || participant.status !== "ACCEPTED") notFound();

  const list =
    participant.role === "STUDENT"
      ? await listStudentMentorships(session.userId)
      : await listMentorMentorships(session.userId);
  const mentorship = list.find((m) => m.requestId === requestId);
  if (!mentorship) notFound();
  const sessions = await listSessions(requestId, session.userId);

  return (
    <>
      <Link href={`${basePath}/mentorships`} className="text-sm font-medium text-blue-800 hover:underline">
        ← Back to mentorships
      </Link>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">
            {participant.role === "STUDENT" ? "Your mentor" : "Your mentee"}
          </p>
          <h1 className="text-xl font-bold">{mentorship.otherName}</h1>
          <p className="text-sm text-slate-600">{mentorship.otherDetail}</p>
          <p className="mt-1 text-sm">Since: {formatDate(mentorship.responseDate ?? mentorship.requestDate)}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Next Session</p>
          <p>{mentorship.nextSession ? formatDateTime(mentorship.nextSession) : "None scheduled"}</p>
          <p className="mt-2 font-semibold">Sessions completed: {mentorship.completedSessions}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <SessionScheduler requestId={requestId} />
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-600">No sessions yet. Schedule the first one.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.sessionId}
                session={s}
                label={formatDateTime(s.scheduledDate)}
                feedbackPath={`${basePath}/feedback/${s.sessionId}`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
