import { getReports } from "@/lib/admin";
import { jsonError } from "@/lib/http";
import { getSession } from "@/lib/session";

// Downloads the FR-13 report as a CSV file of aggregated figures only (DR-06).
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return jsonError("Administrators only.", 403);

  const includeSynthetic = new URL(request.url).searchParams.get("synthetic") === "include";
  const metrics = await getReports(includeSynthetic);
  const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;
  const lines = [
    "metric,value,numerator,denominator,note",
    ...metrics.map((m) =>
      [
        m.key,
        m.value === null ? "" : m.value.toFixed(4),
        m.numerator ?? "",
        m.denominator,
        escape(m.note),
      ].join(","),
    ),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="platform-report-${date}${includeSynthetic ? "-with-synthetic" : ""}.csv"`,
    },
  });
}
