import { NextResponse, type NextRequest } from "next/server";
import { HOME_BY_ROLE } from "@/lib/roles";
import { SESSION_COOKIE, verifySessionToken, type Role } from "@/lib/session";

// Which role may use each area of the site (NFR-02).
const PROTECTED_AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/student", role: "STUDENT" },
  { prefix: "/mentor", role: "ALUMNI_MENTOR" },
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/api/student", role: "STUDENT" },
  { prefix: "/api/mentor", role: "ALUMNI_MENTOR" },
  { prefix: "/api/admin", role: "ADMIN" },
];

function findArea(pathname: string) {
  return PROTECTED_AREAS.find(
    (area) => pathname === area.prefix || pathname.startsWith(`${area.prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  // Logged-in users are sent from the login and register pages to their home page.
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], request.url));
  }

  const area = findArea(pathname);
  if (!area) {
    return NextResponse.next(); // public page or route
  }

  // Not logged in: pages go to the login page, API calls get 401.
  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in with the wrong role: pages go to the user's own home, API calls get 403.
  if (session.role !== area.role) {
    if (isApi) {
      return NextResponse.json(
        { error: "You do not have access to this." },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], request.url));
  }

  return NextResponse.next();
}

// Run on every request except Next.js build files and the site icon.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};