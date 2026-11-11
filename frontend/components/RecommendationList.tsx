import MentorCard from "@/components/MentorCard";
import type { RecommendationResult } from "@/lib/recommendations";

export default function RecommendationList({
  result,
  limit,
}: {
  result: RecommendationResult;
  limit?: number;
}) {
  const items = limit ? result.items.slice(0, limit) : result.items;
  return (
    <div className="space-y-3">
      {result.source === "stored" && result.message && (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.message}
          {result.generatedAt &&
            ` (generated ${new Date(result.generatedAt).toLocaleString("en-GB")})`}
        </p>
      )}
      {result.source === "none" && (
        <p className="rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-700">{result.message}</p>
      )}
      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((mentor) => (
            <MentorCard key={mentor.recommendationId} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  );
}
