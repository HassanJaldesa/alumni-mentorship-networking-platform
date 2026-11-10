import type { ProfileData } from "@/lib/profile";

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
          {item}
        </span>
      ))}
    </div>
  );
}

// Read-only view of a user's own profile (FR-02).
export default function ProfileSummary({
  profile,
  isStudent,
  editPath,
}: {
  profile: ProfileData;
  isStudent: boolean;
  editPath: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your profile</h2>
        <a
          href={editPath}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Edit profile
        </a>
      </div>

      {!profile.vectorsUpToDate && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your matching data is not up to date with your latest answers. Save your profile
          again to retry.
        </p>
      )}

      <dl className="grid gap-4 text-sm md:grid-cols-2">
        {isStudent ? (
          <div>
            <dt className="font-semibold text-slate-500">Programme</dt>
            <dd>
              {profile.academicBackground} ({profile.yearOfStudy})
            </dd>
          </div>
        ) : (
          <div>
            <dt className="font-semibold text-slate-500">Experience</dt>
            <dd>
              {profile.yearsOfExperience} years · up to {profile.maxMentees} mentees
            </dd>
          </div>
        )}
        <div>
          <dt className="font-semibold text-slate-500">Industry</dt>
          <dd>{profile.industry}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Availability</dt>
          <dd>{profile.availability}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Last updated</dt>
          <dd>{new Date(profile.lastUpdated).toLocaleDateString("en-GB")}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="mb-1 font-semibold text-slate-500">Skills</dt>
          <dd>
            <Chips items={profile.skills} />
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="mb-1 font-semibold text-slate-500">Mentorship interests</dt>
          <dd>
            <Chips items={profile.mentorshipInterests} />
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="font-semibold text-slate-500">
            {isStudent ? "Biography" : "Professional summary"}
          </dt>
          <dd className="whitespace-pre-line">{profile.biography}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="font-semibold text-slate-500">
            {isStudent ? "Career goals" : "Mentoring focus"}
          </dt>
          <dd className="whitespace-pre-line">{profile.careerGoals}</dd>
        </div>
      </dl>
    </section>
  );
}