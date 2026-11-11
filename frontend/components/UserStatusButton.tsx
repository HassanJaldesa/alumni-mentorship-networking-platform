"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserStatusButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setBusy(false);
    if (!response.ok) {
      setError((await response.json()).error ?? "Could not update.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
