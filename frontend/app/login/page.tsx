import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Login or Register" };

// Login and registration side by side, following the Figure 4.5 wireframe.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-800 text-sm font-bold text-white">
            AM
          </span>
          <h1 className="text-lg font-semibold">Alumni Mentorship and Networking Platform</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold">Login</h2>
          <LoginForm next={typeof next === "string" ? next : undefined} />
          <div className="my-6 flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="mb-3 text-center text-sm">Don&apos;t have an account?</p>
          <a
            href="#register"
            className="mx-auto block w-40 rounded-md border border-slate-300 py-2 text-center text-sm font-semibold hover:bg-slate-50"
          >
            Register
          </a>
        </section>

        <section id="register" className="scroll-mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold">Register</h2>
          <RegisterForm />
        </section>
      </main>
    </div>
  );
}