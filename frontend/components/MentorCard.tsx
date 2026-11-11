import Link from "next/link";
import type { RecommendedMentor } from "@/lib/recommendations";

// A recommended mentor with the attributes they were matched on (Figure 4.7).
export default function MentorCard({ mentor }: { mentor: RecommendedMentor }) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {mentor.firstName[0]}
            {mentor.lastName[0]}
          </span>
          <div>
            <h3 className="font-semibold">
              {mentor.firstName} {mentor.lastName}
            </h3>
            <p className="text-sm text-slate-500">
              {mentor.industry}
              {mentor.yearsOfExperience !== null && ` · ${mentor.yearsOfExperience} years`}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900">
          #{mentor.rank}
        </span>
      </div>

      <p className="mt-3 text-sm">
        <span className="font-medium">Skills:</span> {mentor.skills.join(", ")}
      </p>

      <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
        <p className="font-semibold">Matched on:</p>
        <ul className="mt-1 list-disc pl-5 text-slate-700">
          <li>Industry: {mentor.industry}</li>
          {mentor.sharedInterests.length > 0 && (
            <li>Shared interests: {mentor.sharedInterests.join(", ")}</li>
          )}
          {mentor.availabilityMatch && <li>Availability: {mentor.availability}</li>}
          <li>Profile similarity: {mentor.similarityScore.toFixed(2)}</li>
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/student/mentors/${mentor.mentorId}`}
          className="rounded-md border border-slate-300 py-2 text-center text-sm font-semibold hover:bg-slate-50"
        >
          View Profile
        </Link>
        <Link
          href={`/student/mentors/${mentor.mentorId}#request`}
          className="rounded-md bg-blue-800 py-2 text-center text-sm font-semibold text-white hover:bg-blue-900"
        >
          Request Mentorship
        </Link>
      </div>
      <p className="mt-2 text-center text-xs italic text-slate-500">
        Rate relevance after your session
      </p>
    </article>
  );
}
