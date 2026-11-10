"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { HOME_BY_ROLE } from "@/lib/roles";
import type { Role } from "@/lib/session";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    // Quick checks in the browser; the server repeats every check.
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("The two passwords do not match.");
      return;
    }
    if (!form.get("role")) {
      setError("Choose either Student or Alumni Mentor.");
      return;
    }
    if (form.get("consent") !== "on") {
      setError("You must agree to how your data is used before registering.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
          consent: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      router.push(HOME_BY_ROLE[data.role as Role]);
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-first" className="mb-1 block text-sm font-medium">
            First Name
          </label>
          <input id="reg-first" name="firstName" placeholder="First name" autoComplete="given-name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="reg-last" className="mb-1 block text-sm font-medium">
            Last Name
          </label>
          <input id="reg-last" name="lastName" placeholder="Last name" autoComplete="family-name" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input id="reg-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <PasswordInput id="reg-password" name="password" placeholder="Create password" autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium">
            Confirm Password
          </label>
          <PasswordInput id="reg-confirm" name="confirmPassword" placeholder="Confirm password" autoComplete="new-password" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        At least 8 characters, including a letter and a number.
      </p>

      <div>
        <label htmlFor="reg-role" className="mb-1 block text-sm font-medium">
          Role
        </label>
        <select id="reg-role" name="role" defaultValue="" required className={inputClass}>
          <option value="" disabled>
            Select role: Student or Alumni Mentor
          </option>
          <option value="STUDENT">Student</option>
          <option value="ALUMNI_MENTOR">Alumni Mentor</option>
        </select>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input name="consent" type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-800" />
        I consent to the collection and use of my profile data for mentor matching and evaluation.
      </label>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-800 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-xs italic text-slate-500">
        Administrator accounts are created by an existing administrator.
      </p>
    </form>
  );
}