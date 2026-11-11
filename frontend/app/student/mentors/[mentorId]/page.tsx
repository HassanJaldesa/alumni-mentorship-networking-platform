import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequestPanel, { type RequestState } from "@/components/RequestPanel";
import { query } from "@/lib/db";
import { getMentorDetails, markRecommendationViewed } from "@/lib/mentors";
import { getStudentId } from "@/lib/recommendations";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mentor Profile" };

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 border-b border-slate-200 pb-2 font-semibold">{title}</h2>
      <div className="text-sm text-slate-700">{children}</div>
    </section>
  );
}

// Mentor profile and mentorship request (Figure 4.8, FR-07, FR-08).
export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { mentorId } = await params;
  const mentor = await getMentorDetails(mentorId);
  if (!mentor) notFound();

  const studentId = await getStudentId(session.userId);
  if (studentId) await markRecommendationViewed(studentId, mentor.mentorId);
  const placesLeft = Math.max(0, mentor.maxMentees - mentor.activeMentees);

  // What the request panel should show for this student and mentor (FR-08).
  const [latest] = studentId
    ? await query<{ status: string }>(
        `SELECT status FROM mentorship_requests WHERE student_id = $1 AND mentor_id = $2
         ORDER BY (status = 'ACCEPTED') DESC, request_date DESC LIMIT 1`,
        [studentId, mentor.mentorId],
      )
    : [];
  const requestState: RequestState =
    latest?.status === "ACCEPTED"
      ? "active"
      : latest?.status === "PENDING"
        ? "pending"
        : placesLeft === 0
          ? "full"
          : "can-request";

  return (
    <AppShell session={session}>
      <Link
        href="/student/recommendations"
        className="text-sm font-medium text-blue-800 hover:underline"
      >
        ← Back to recommendations
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center lg:col-span-2">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-700">
            {mentor.firstName[0]}
            {mentor.lastName[0]}
          </span>
          <div>
            <h1 className="text-2xl font-bold">
              {mentor.firstName} {mentor.lastName}
            </h1>
            <p className="text-slate-600">{mentor.industry}</p>
            <p className="mt-1 text-sm font-semibold">
              Mentee places: {placesLeft} of {mentor.maxMentees} available
            </p>
          </div>
        </section>
        <div className="lg:row-span-2">
          <RequestPanel mentorId={mentor.mentorId} state={requestState} />
        </div>
        <div className="lg:col-span-2">
          <Box title="About">
            <p className="whitespace-pre-line">{mentor.biography}</p>
          </Box>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Box title="Skills">
          <ul className="list-disc pl-5">
            {mentor.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </Box>
        <Box title="Industry Experience">
          <p>{mentor.industry}</p>
          {mentor.yearsOfExperience !== null && <p>Years: {mentor.yearsOfExperience}</p>}
        </Box>
        <Box title="Mentorship Interests">
          <ul className="list-disc pl-5">
            {mentor.interests.map((interest) => (
              <li key={interest}>{interest}</li>
            ))}
          </ul>
        </Box>
        <Box title="Availability">
          <p>{mentor.availability}</p>
        </Box>
      </div>

      <Box title="Mentoring Focus">
        <p className="whitespace-pre-line">{mentor.mentoringFocus}</p>
      </Box>
    </AppShell>
  );
}
