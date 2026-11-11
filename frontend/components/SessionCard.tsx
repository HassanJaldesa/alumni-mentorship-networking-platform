"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionItem } from "@/lib/mentorships";

const STATUS_STYLE = {
  SCHEDULED: "bg-blue-50 text-blue-900",
  COMPLETED: "bg-green-50 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
} as const;

const buttonClass =
  "rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60";

// One session with its actions and progress notes (Figure 4.9, FR-10).
// Completing a session takes the user straight to the feedback form (FR-11).
export default function SessionCard({
  session,
  label,
  feedbackPath,
}: {
  session: SessionItem;
  label: string; // date and time, formatted on the server
  feedbackPath: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [notes, setNotes] = useState(session.progressNotes);
  const [notesSaved, setNotesSaved] = useState(false);

  async function update(body: Record<string, unknown>) {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/sessions/${session.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setBusy(false);
      if (!response.ok) {
        setError(data.error ?? "The session could not be updated.");
        return false;
      }
      return true;
    } catch {
      setBusy(false);
      setError("Could not reach the server.");
      return false;
    }
  }

  async function complete() {
    if (await update({ action: "complete" })) router.push(feedbackPath);
  }

  async function cancel() {
    if (await update({ action: "cancel" })) router.refresh();
  }

  async function reschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("scheduledDate") ?? "");
    if (!value) return;
    if (await update({ action: "reschedule", scheduledDate: new Date(value).toISOString() })) {
      setRescheduling(false);
      router.refresh();
    }
  }

  async function saveNotes() {
    setNotesSaved(false);
    if (await update({ action: "notes", progressNotes: notes })) setNotesSaved(true);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{session.topic}</p>
          <p className="text-sm text-slate-600">
            {label}
            {session.duration ? ` · ${session.duration} min` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[session.status]}`}>
          {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {session.status === "SCHEDULED" && (
          <>
            <button type="button" disabled={busy} onClick={() => setRescheduling(!rescheduling)} className={buttonClass}>
              Reschedule
            </button>
            <button type="button" disabled={busy} onClick={complete} className={buttonClass}>
              Complete
            </button>
            <button type="button" disabled={busy} onClick={cancel} className={buttonClass}>
              Cancel
            </button>
          </>
        )}
        {session.status === "COMPLETED" &&
          (session.myFeedbackGiven ? (
            <span className="text-sm text-green-700">Feedback given ✓</span>
          ) : (
            <Link href={feedbackPath} className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900">
              Give Feedback
            </Link>
          ))}
      </div>

      {rescheduling && (
        <form onSubmit={reschedule} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">New date and time</span>
            <input name="scheduledDate" type="datetime-local" required className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </label>
          <button type="submit" disabled={busy} className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">
            Save
          </button>
        </form>
      )}

      {session.status !== "CANCELLED" && (
        <div className="mt-3">
          <label htmlFor={`notes-${session.sessionId}`} className="mb-1 block text-sm font-semibold">
            Progress notes
          </label>
          <textarea
            id={`notes-${session.sessionId}`}
            rows={3}
            maxLength={5000}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesSaved(false);
            }}
            placeholder="Add progress notes for this session..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
          <div className="mt-1 flex items-center justify-end gap-3">
            {notesSaved && <span className="text-xs text-green-700">Saved</span>}
            <button type="button" disabled={busy} onClick={saveNotes} className={buttonClass}>
              Save Notes
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </article>
  );
}
