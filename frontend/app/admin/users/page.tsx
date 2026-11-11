import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CreateAdminForm from "@/components/CreateAdminForm";
import UserStatusButton from "@/components/UserStatusButton";
import { listUsers } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

const ROLES = [
  { value: "", label: "All" },
  { value: "STUDENT", label: "Students" },
  { value: "ALUMNI_MENTOR", label: "Mentors" },
  { value: "ADMIN", label: "Administrators" },
];
const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  ALUMNI_MENTOR: "Alumni Mentor",
  ADMIN: "Administrator",
};

// User management (FR-12).
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { role, q } = await searchParams;
  const roleFilter = ROLES.some((r) => r.value && r.value === role) ? role! : null;
  const search = q?.trim() ? q.trim().slice(0, 100) : null;
  const users = await listUsers(roleFilter, search);

  return (
    <AppShell session={session}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <CreateAdminForm />
      </div>

      <form className="flex flex-wrap items-center gap-2">
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search name or email"
          className="w-64 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        />
        <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Search
        </button>
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <Link
              key={r.label}
              href={`/admin/users${r.value ? `?role=${r.value}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                (roleFilter ?? "") === r.value ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold">Registered</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {ROLE_LABEL[u.role]}
                  {u.role !== "ADMIN" && !u.onboarded && (
                    <span className="ml-1 text-xs text-amber-700">(not onboarded)</span>
                  )}
                </td>
                <td className="px-4 py-2">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? "text-green-700" : "text-slate-500"}>
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {u.userId !== session.userId && <UserStatusButton userId={u.userId} isActive={u.isActive} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Showing up to 200 users. A deactivated user cannot log in and is not recommended to students.
      </p>
    </AppShell>
  );
}
