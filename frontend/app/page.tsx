import { redirect } from "next/navigation";
import { HOME_BY_ROLE } from "@/lib/roles";
import { getSession } from "@/lib/session";

// The root address sends users to their home page, or to login.
export default async function RootPage() {
  const session = await getSession();
  redirect(session ? HOME_BY_ROLE[session.role] : "/login");
}