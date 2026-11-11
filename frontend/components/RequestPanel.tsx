"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type RequestState = "can-request" | "pending" | "active" | "full";

// "Request Mentorship" panel on a mentor's profile (Figure 4.8, FR-08).
export default function RequestPanel({ mentorId, state }: { mentorId: string; state: RequestState }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/student/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: form.get("message") }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Your request could not be sent.");
        setSending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setSending(false);
    }
  }

  return (
    <section id="request" className="scroll-mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Request Mentorship</h2>
      {state === "pending" && (
        <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Your request has been sent and is waiting for the mentor&apos;s answer.
        </p>
      )}
      {state === "active" && (
        <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          This mentor has accepted you. Manage your sessions under Mentorships.
        </p>
      )}
      {state === "full" && (
        <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          This mentor has no free mentee places right now.
        </p>
      )}
      {state === "can-request" && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <label htmlFor="message" className="block text-sm text-slate-600">
            Write a brief message to the mentor (optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={1000}
            placeholder="Type your message..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md bg-blue-800 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Request"}
          </button>
        </form>
      )}
    </section>
  );
}
