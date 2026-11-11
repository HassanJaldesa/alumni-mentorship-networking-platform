import Link from "next/link";
import RequestActions from "@/components/RequestActions";
import { formatDate, formatDateTime } from "@/lib/format";
import type { MentorshipSummary } from "@/lib/mentorships";

const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-green-50 text-green-800",
  DECLINED: "bg-slate-100 text-slate-600",
} as const;

// Requests and mentorships for one user (Figure 4.9). Mentors see Accept and
// Decline on pending requests; students see the status of what they sent.
export default function MentorshipList({
  items,
  isMentor,
  basePath,
  pendingOnly = false,
}: {
  items: MentorshipSummary[];
  isMentor: boolean;
  basePath: string;
  pendingOnly?: boolean; // the mentor dashboard shows only requests awaiting an answer
}) {
  const pending = items.filter((m) => m.status === "PENDING");
  const active = items.filter((m) => m.status === "ACCEPTED");
  const declined = items.filter((m) => m.status === "DECLINED");
  const who = isMentor ? "Student" : "Mentor";

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isMentor ? "Mentorship Requests" : "Pending Requests"}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-600">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">{who}</th>
                  <th className="px-4 py-2 font-semibold">Message</th>
                  <th className="px-4 py-2 font-semibold">Requested</th>
                  <th className="px-4 py-2 font-semibold">{isMentor ? "Action" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((m) => (
                  <tr key={m.requestId} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.otherName}</p>
                      <p className="text-xs text-slate-500">{m.otherDetail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{m.message || "—"}</td>
                    <td className="px-4 py-3">{formatDate(m.requestDate)}</td>
                    <td className="px-4 py-3">
                      {isMentor ? (
                        <RequestActions requestId={m.requestId} />
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE.PENDING}`}
                        >
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!pendingOnly && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Active Mentorships</h2>
          {active.length === 0 ? (
            <p className="text-sm text-slate-600">No active mentorships yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((m) => (
                <Link
                  key={m.requestId}
                  href={`${basePath}/${m.requestId}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"
                >
                  <p className="font-semibold">{m.otherName}</p>
                  <p className="text-sm text-slate-500">{m.otherDetail}</p>
                  <p className="mt-2 text-sm">
                    Since: {formatDate(m.responseDate ?? m.requestDate)}
                  </p>
                  <p className="text-sm">
                    Next session: {m.nextSession ? formatDateTime(m.nextSession) : "none scheduled"}
                  </p>
                  <p className="text-sm">Sessions completed: {m.completedSessions}</p>
                  <p className="mt-2 text-sm font-medium text-blue-800">Open mentorship →</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!pendingOnly && declined.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Declined</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {declined.map((m) => (
              <li key={m.requestId}>
                {m.otherName}, requested {formatDate(m.requestDate)}
                {!isMentor && (
                  <>
                    {" · "}
                    <Link
                      href={`/student/mentors/${m.mentorId}`}
                      className="text-blue-800 hover:underline"
                    >
                      view profile
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
