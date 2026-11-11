import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getReports, type Metric } from "@/lib/admin";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

function display(metric: Metric): string {
  if (metric.value === null) return "—";
  return metric.kind === "rate" ? `${(metric.value * 100).toFixed(1)}%` : metric.value.toFixed(2);
}

// Evaluation reports (FR-13), shown only as aggregated figures (DR-06).
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ synthetic?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const includeSynthetic = (await searchParams).synthetic === "include";
  const metrics = await getReports(includeSynthetic);
  const query = includeSynthetic ? "?synthetic=include" : "";

  return (
    <AppShell session={session}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <a
          href={`/api/admin/reports${query}`}
          className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900"
        >
          Download CSV
        </a>
      </div>
      <p className="text-sm text-slate-600">
        {includeSynthetic ? "Including" : "Excluding"} synthetic test accounts (@synthetic.test).{" "}
        <Link
          href={includeSynthetic ? "/admin/reports" : "/admin/reports?synthetic=include"}
          className="font-medium text-blue-800 hover:underline"
        >
          {includeSynthetic ? "Exclude them" : "Include them"}
        </Link>
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <section key={m.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{m.title}</h2>
            <p className="mt-2 text-3xl font-bold">{display(m)}</p>
            <p className="text-xs text-slate-500">
              {m.numerator !== null ? `${m.numerator} of ${m.denominator}` : `n = ${m.denominator}`}
            </p>
            {m.target && <p className="mt-2 text-xs font-semibold text-blue-900">{m.target}</p>}
            <p className="mt-2 text-sm text-slate-600">{m.note}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
