"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileData } from "@/lib/profile";
import { LIMITS, YEARS_OF_STUDY } from "@/lib/profileRules";
import { AVAILABILITY, INDUSTRIES, MENTORSHIP_INTERESTS, SKILLS } from "@/lib/vocabulary";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";
const labelClass = "mb-1 block text-sm font-semibold";

interface OnboardingFormProps {
  role: "STUDENT" | "ALUMNI_MENTOR";
  initial: ProfileData | null; // null on first-time onboarding
  homePath: string;
}

// A group of tick boxes shown as selectable chips.
function ChipGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: readonly string[];
  selected: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm has-[:checked]:border-blue-800 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-900"
        >
          <input
            type="checkbox"
            name={name}
            value={option}
            defaultChecked={selected.includes(option)}
            className="h-3.5 w-3.5 accent-blue-800"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

// The onboarding questionnaire from the Figure 4.6 wireframe (FR-03 to FR-05).
// Also used to edit the profile later (FR-02).
export default function OnboardingForm({ role, initial, homePath }: OnboardingFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const isStudent = role === "STUDENT";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWarning("");
    const form = new FormData(event.currentTarget);

    const skills = form.getAll("skills");
    const mentorshipInterests = form.getAll("mentorshipInterests");
    if (skills.length === 0) {
      setError("Select at least one skill.");
      return;
    }
    if (mentorshipInterests.length === 0) {
      setError("Select at least one mentorship interest.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: form.get("industry"),
          skills,
          mentorshipInterests,
          availability: form.get("availability"),
          biography: form.get("biography"),
          careerGoals: form.get("careerGoals"),
          academicBackground: form.get("academicBackground"),
          yearOfStudy: form.get("yearOfStudy"),
          yearsOfExperience: form.get("yearsOfExperience"),
          maxMentees: form.get("maxMentees"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Your profile could not be saved. Please try again.");
        setSaving(false);
        return;
      }
      if (!data.vectorsGenerated) {
        // Profile saved, but the recommendation service could not be reached.
        setWarning(
          "Your profile is saved, but matching data could not be updated right now. It will be updated when you next save your profile.",
        );
        setSaving(false);
        return;
      }
      router.push(homePath);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-2xl font-bold">
          {initial ? "Edit your profile" : "Tell us about yourself"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isStudent
            ? "Your answers are used to recommend suitable mentors."
            : "Your answers are used to match you with suitable students."}
        </p>
      </div>

      {/* Background (DR-01) */}
      <div className="grid gap-4 md:grid-cols-2">
        {isStudent ? (
          <>
            <div>
              <label htmlFor="academicBackground" className={labelClass}>
                Programme of Study
              </label>
              <input
                id="academicBackground"
                name="academicBackground"
                placeholder="e.g. BSc Computer Science"
                defaultValue={initial?.academicBackground}
                maxLength={LIMITS.academicBackground.max}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="yearOfStudy" className={labelClass}>
                Year of Study
              </label>
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                defaultValue={initial?.yearOfStudy ?? ""}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Select year of study
                </option>
                {YEARS_OF_STUDY.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="yearsOfExperience" className={labelClass}>
              Years of Professional Experience
            </label>
            <input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={LIMITS.yearsOfExperience.min}
              max={LIMITS.yearsOfExperience.max}
              placeholder="e.g. 5"
              defaultValue={initial?.yearsOfExperience ?? undefined}
              required
              className={inputClass}
            />
          </div>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>Skills (select all that apply)</legend>
        <ChipGroup name="skills" options={SKILLS} selected={initial?.skills ?? []} />
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="industry" className={labelClass}>
            {isStudent ? "Industry of Interest" : "Industry"}
          </label>
          <select
            id="industry"
            name="industry"
            defaultValue={initial?.industry ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Select industry
            </option>
            {INDUSTRIES.map((industry) => (
              <option key={industry}>{industry}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="availability" className={labelClass}>
            Availability
          </label>
          <select
            id="availability"
            name="availability"
            defaultValue={initial?.availability ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Select availability
            </option>
            {AVAILABILITY.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Mentorship Interests (select all that apply)</legend>
        <ChipGroup
          name="mentorshipInterests"
          options={MENTORSHIP_INTERESTS}
          selected={initial?.mentorshipInterests ?? []}
        />
      </fieldset>

      {!isStudent && (
        <div className="md:w-1/2 md:pr-2">
          <label htmlFor="maxMentees" className={labelClass}>
            Maximum Mentees
          </label>
          <input
            id="maxMentees"
            name="maxMentees"
            type="number"
            min={LIMITS.maxMentees.min}
            max={LIMITS.maxMentees.max}
            placeholder="e.g. 3"
            defaultValue={initial?.maxMentees ?? 3}
            required
            className={inputClass}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="biography" className={labelClass}>
            {isStudent ? "Profile Biography" : "Professional Summary"}
          </label>
          <textarea
            id="biography"
            name="biography"
            rows={6}
            placeholder={
              isStudent
                ? "Write a short biography about yourself..."
                : "Summarise your career, roles and expertise..."
            }
            defaultValue={initial?.biography}
            minLength={LIMITS.biography.min}
            maxLength={LIMITS.biography.max}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">At least {LIMITS.biography.min} characters.</p>
        </div>
        <div>
          <label htmlFor="careerGoals" className={labelClass}>
            {isStudent ? "Career Goals" : "Mentoring Focus"}
          </label>
          <textarea
            id="careerGoals"
            name="careerGoals"
            rows={6}
            placeholder={
              isStudent
                ? "Describe your career goals..."
                : "Describe what you can help students with..."
            }
            defaultValue={initial?.careerGoals}
            minLength={LIMITS.careerGoals.min}
            maxLength={LIMITS.careerGoals.max}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">At least {LIMITS.careerGoals.min} characters.</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {warning && (
        <div role="status" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warning}{" "}
          <a href={homePath} className="font-semibold underline">
            Continue
          </a>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {initial && (
          <a
            href={homePath}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </a>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save and Continue"}
        </button>
      </div>
    </form>
  );
}