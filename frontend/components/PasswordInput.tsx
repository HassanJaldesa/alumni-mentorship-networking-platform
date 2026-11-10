"use client";

import { useState } from "react";

interface PasswordInputProps {
  id: string;
  name: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
}

// A password field with a show/hide button, as in the Figure 4.5 wireframe.
export default function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-16 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}