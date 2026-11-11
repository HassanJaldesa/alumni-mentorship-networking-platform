"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Accept and Decline buttons for a pending request (FR-09).
export default function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function answer(action: "accept" | "decline") {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/mentor/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "The request could not be updated.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => answer("accept")}
          className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => answer("decline")}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
