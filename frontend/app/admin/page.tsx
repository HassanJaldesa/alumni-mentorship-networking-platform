import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Administrator Dashboard" };

// Placeholder home page. Replaced by the dashboard in Step 10.
export default async function AdminHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold">Welcome, {session.firstName}</h1>
      <p className="text-slate-600">User management and platform reports will appear here.</p>
    </AppShell>
  );
}
