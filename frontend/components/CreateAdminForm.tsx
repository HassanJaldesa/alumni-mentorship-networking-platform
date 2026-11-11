"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";

// Administrators are created only by an existing administrator (FR-01).
export default function CreateAdminForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (!response.ok) {
      setError((await response.json()).error ?? "Could not create the account.");
      return;
    }
    formElement.reset();
    setMessage("Administrator account created.");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
        Create administrator
      </button>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
      <input name="firstName" placeholder="First name" required className={inputClass} />
      <input name="lastName" placeholder="Last name" required className={inputClass} />
      <input name="email" type="email" placeholder="Email" required className={inputClass} />
      <input name="password" type="password" placeholder="Temporary password" required className={inputClass} />
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-4">{error}</p>}
      {message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 md:col-span-4">{message}</p>}
      <div className="flex justify-end gap-2 md:col-span-4">
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Close
        </button>
        <button type="submit" className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900">
          Create
        </button>
      </div>
    </form>
  );
}
