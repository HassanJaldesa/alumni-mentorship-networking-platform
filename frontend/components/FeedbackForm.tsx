"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LABELS = ["1", "2", "3", "4", "5"];

// Five selectable stars for a 1-5 rating (DR-02: whole numbers 1 to 5).
function StarRating({
  name,
  value,
  onChange,
  low,
  high,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div>
      <div role="radiogroup" className="flex gap-2">
        {LABELS.map((label, index) => {
          const score = index + 1;
          const selected = score <= value;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={score === value}
              aria-label={`${name} ${score} of 5`}
              onClick={() => onChange(score)}
              className="flex flex-col items-center"
            >
              <span className={`text-3xl leading-none ${selected ? "text-amber-500" : "text-slate-300"}`}>★</span>
              <span className="text-xs font-semibold">{score}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex w-56 justify-between text-xs text-slate-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

// Feedback form (Figure 4.10, FR-11).
export default function FeedbackForm({
  sessionId,
  isStudent,
  returnPath,
}: {
  sessionId: string;
  isStudent: boolean;
  returnPath: string;
}) {
  const router = useRouter();
  const [relevance, setRelevance] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!relevance || !satisfaction) {
      setError("Choose a rating for both questions.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          relevanceRating: relevance,
          satisfactionScore: satisfaction,
          comments: new FormData(event.currentTarget).get("comments"),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Your feedback could not be saved.");
        setSaving(false);
        return;
      }
      router.push(returnPath);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <fieldset>
          <legend className="font-semibold">Recommendation Relevance</legend>
          <p className="mb-2 text-sm text-slate-600">
            {isStudent
              ? "How relevant was this mentor recommendation to your goals?"
              : "How well did this student match your expertise?"}
          </p>
          <StarRating name="Relevance" value={relevance} onChange={setRelevance} low="Not Relevant" high="Highly Relevant" />
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Overall Satisfaction</legend>
          <p className="mb-2 text-sm text-slate-600">How satisfied are you with this mentorship?</p>
          <StarRating name="Satisfaction" value={satisfaction} onChange={setSatisfaction} low="Not Satisfied" high="Very Satisfied" />
        </fieldset>
      </div>
      <div>
        <label htmlFor="comments" className="mb-1 block font-semibold">Comments (optional)</label>
        <textarea
          id="comments"
          name="comments"
          rows={7}
          maxLength={2000}
          placeholder="Share your feedback..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 md:col-span-2">
        <a href={returnPath} className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">
          Cancel
        </a>
        <button type="submit" disabled={saving} className="rounded-md bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">
          {saving ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </form>
  );
}
