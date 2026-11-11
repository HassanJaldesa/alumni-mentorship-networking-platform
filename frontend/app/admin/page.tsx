import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { getOverview, getRecentActivity } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Administrator Dashboard" };

// Administrator dashboard (Figure 4.11, FR-12).
export default async function AdminHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [overview, activity] = await Promise.all([getOverview(), getRecentActivity()]);
  const total = overview.students + overview.mentors + overview.admins;
  const distribution = [
    { label: "Students", value: overview.students, color: "bg-blue-700" },
    { label: "Alumni Mentors", value: overview.mentors, color: "bg-teal-600" },
    { label: "Administrators", value: overview.admins, color: "bg-slate-500" },
  ];

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold">Platform Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={total} label="Total Users" />
        <StatCard value={overview.activeMentorships} label="Active Mentorships" />
        <StatCard value={overview.completedSessions} label="Sessions Completed" />
        <StatCard value={overview.pendingRequests} label="Pending Requests" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">User Distribution</h2>
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${d.color}`}
                    style={{ width: `${total ? (d.value / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-600">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a, i) => (
                <li key={i}>
                  <p className="font-medium">{a.text}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(a.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            Manage Users
          </Link>
          <Link href="/admin/reports" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            Generate Reports
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
