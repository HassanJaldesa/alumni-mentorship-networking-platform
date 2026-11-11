"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";

// "Schedule New Session" form (Figure 4.9, FR-10).
export default function SessionScheduler({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const when = String(form.get("scheduledDate") ?? "");
    if (!when) {
      setError("Choose a date and time.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/mentorships/${requestId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.get("topic"),
          // The browser's local time, sent as an exact moment.
          scheduledDate: new Date(when).toISOString(),
          duration: Number(form.get("duration")),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "The session could not be scheduled.");
        setSaving(false);
        return;
      }
      setOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
      >
        Schedule New Session
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
    >
      <div className="md:col-span-2">
        <label htmlFor="topic" className="mb-1 block text-sm font-semibold">Topic</label>
        <input id="topic" name="topic" required maxLength={200} placeholder="e.g. CV review" className={inputClass} />
      </div>
      <div>
        <label htmlFor="scheduledDate" className="mb-1 block text-sm font-semibold">Date and time</label>
        <input id="scheduledDate" name="scheduledDate" type="datetime-local" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="duration" className="mb-1 block text-sm font-semibold">Minutes</label>
        <input id="duration" name="duration" type="number" min={15} max={240} defaultValue={60} required className={inputClass} />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-4">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 md:col-span-4">
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">
          {saving ? "Saving..." : "Schedule"}
        </button>
      </div>
    </form>
  );
}
