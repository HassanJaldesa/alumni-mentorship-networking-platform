"""Load or remove the synthetic dataset (DR-04).

Run from the ml-service folder with the virtual environment active:

    python -m synthetic.load            # remove old synthetic data, then load it again
    python -m synthetic.load --remove   # only remove it (do this before the pilot)

Every synthetic account uses an @synthetic.test email and the shared test
password below. They are test data only and must be removed before real users
join the pilot.
"""
import argparse
import json
import time

import bcrypt
from sqlalchemy import text

from app.database import SessionLocal
from app.services.profile_vectors import generate_profile_vectors
from synthetic.profiles import EMAIL_DOMAIN, MentorSpec, StudentSpec, all_mentors, all_students

SYNTHETIC_PASSWORD = "Synthetic2026"


def remove_synthetic_data(db) -> int:
    """Delete every synthetic user; their rows in other tables cascade."""
    result = db.execute(
        text("DELETE FROM users WHERE email LIKE :pattern"), {"pattern": f"%@{EMAIL_DOMAIN}"}
    )
    db.commit()
    return result.rowcount


def insert_user(db, person, role: str, password_hash: str) -> str:
    return db.execute(
        text(
            """INSERT INTO users (first_name, last_name, email, password_hash, role, consent_given_at)
               VALUES (:first, :last, :email, :hash, :role, now())
               RETURNING user_id"""
        ),
        {"first": person.first_name, "last": person.last_name, "email": person.email,
         "hash": password_hash, "role": role},
    ).scalar_one()


def insert_profile(db, user_id, features: dict, biography: str, goals: str) -> None:
    """Same shape as the Next.js profile API saves (app/api/profile/route.ts)."""
    db.execute(
        text(
            """INSERT INTO profiles (user_id, structured_features, bio_text, biography, career_goals)
               VALUES (:user_id, CAST(:features AS jsonb), :bio_text, :biography, :goals)"""
        ),
        {"user_id": user_id, "features": json.dumps(features),
         "bio_text": f"{biography}\n\n{goals}", "biography": biography, "goals": goals},
    )


def load_student(db, s: StudentSpec, password_hash: str) -> str:
    user_id = insert_user(db, s, "STUDENT", password_hash)
    db.execute(
        text(
            """INSERT INTO students (user_id, academic_background, year_of_study, career_interests,
                                     mentorship_preferences)
               VALUES (:user_id, :programme, :year, :goals, CAST(:preferences AS jsonb))"""
        ),
        {"user_id": user_id, "programme": s.programme, "year": s.year_of_study, "goals": s.career_goals,
         "preferences": json.dumps({"industry": s.industry, "mentorship_interests": list(s.interests),
                                    "availability": s.availability})},
    )
    insert_profile(
        db, user_id,
        {"industry": s.industry, "skills": list(s.skills),
         "mentorship_interests": list(s.interests), "availability": s.availability},
        s.biography, s.career_goals,
    )
    return user_id


def load_mentor(db, m: MentorSpec, password_hash: str) -> str:
    user_id = insert_user(db, m, "ALUMNI_MENTOR", password_hash)
    db.execute(
        text(
            """INSERT INTO alumni_mentors (user_id, industry, years_of_experience, skills,
                                           mentorship_interests, availability, max_mentees, profile_bio)
               VALUES (:user_id, :industry, :years, :skills, :interests, :availability, :max, :bio)"""
        ),
        {"user_id": user_id, "industry": m.industry, "years": m.years_of_experience,
         "skills": ", ".join(m.skills), "interests": ", ".join(m.interests),
         "availability": m.availability, "max": m.max_mentees, "bio": m.summary},
    )
    insert_profile(
        db, user_id,
        {"industry": m.industry, "skills": list(m.skills),
         "mentorship_interests": list(m.interests), "availability": m.availability},
        m.summary, m.focus,
    )
    return user_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Load or remove the synthetic dataset.")
    parser.add_argument("--remove", action="store_true", help="only remove synthetic data")
    args = parser.parse_args()

    with SessionLocal() as db:
        removed = remove_synthetic_data(db)
        print(f"Removed {removed} existing synthetic users.")
        if args.remove:
            return

        started = time.perf_counter()
        # One hash is shared by all synthetic accounts: they use the same test password.
        password_hash = bcrypt.hashpw(SYNTHETIC_PASSWORD.encode(), bcrypt.gensalt(12)).decode()

        user_ids = [load_student(db, s, password_hash) for s in all_students()]
        user_ids += [load_mentor(db, m, password_hash) for m in all_mentors()]
        db.commit()
        print(f"Inserted {len(all_students())} students and {len(all_mentors())} mentors.")

        for user_id in user_ids:
            generate_profile_vectors(db, user_id)
        print(f"Generated vectors for {len(user_ids)} profiles "
              f"in {time.perf_counter() - started:.1f} s.")
        print(f"All synthetic accounts use the password: {SYNTHETIC_PASSWORD}")


if __name__ == "__main__":
    main()