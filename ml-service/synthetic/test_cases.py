"""Run test cases TC-01 to TC-15 from Chapter 5 against the running platform.

Start the recommendation service and the web app first, and load the synthetic
data (python -m synthetic.load). Then, from the ml-service folder:

    python -m synthetic.test_cases --admin-email you@example.com --admin-password ...

Each test prints its actual result. Accounts created by the tests use
tc-*@synthetic.test emails and are removed at the end. TC-14 (load) is run
separately with python -m synthetic.load_test, and TC-16 (browsers) by hand.
"""
import argparse
import csv
import io
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from sqlalchemy import text

from app.database import SessionLocal
from app.services.recommender import availability_compatible

PASSWORD = "Test1234"
SYNTHETIC_PASSWORD = "Synthetic2026"
RESULTS_FILE = Path(__file__).parent / "test_case_results.md"
results: list[tuple[str, str, str, str, bool]] = []


def record(case: str, requirement: str, expected: str, actual: str, passed: bool) -> None:
    results.append((case, requirement, expected, actual, passed))
    print(f"{case:<6} {'PASS' if passed else 'FAIL':<5} {actual}")


def db_one(sql: str, **params):
    with SessionLocal() as db:
        return db.execute(text(sql), params).mappings().first()


def db_run(sql: str, **params) -> None:
    with SessionLocal() as db:
        db.execute(text(sql), params)
        db.commit()


def client(base: str) -> httpx.Client:
    return httpx.Client(base_url=base, timeout=30, follow_redirects=False)


def keep_session(c: httpx.Client, response: httpx.Response) -> None:
    """Store the session cookie ourselves. In production mode the cookie is
    marked Secure, which browsers accept on localhost but httpx does not."""
    match = re.search(r"session=([^;]+)", response.headers.get("set-cookie", ""))
    if match:
        c.cookies.set("session", match.group(1))


def login(base: str, email: str, password: str) -> httpx.Client:
    c = client(base)
    response = c.post("/api/auth/login", json={"email": email, "password": password})
    response.raise_for_status()
    keep_session(c, response)
    return c


def register(c: httpx.Client, email: str, role: str = "STUDENT") -> httpx.Response:
    response = c.post("/api/auth/register", json={
        "firstName": "Test", "lastName": "Case", "email": email, "password": PASSWORD,
        "role": role, "consent": True,
    })
    keep_session(c, response)
    return response


def onboard(c: httpx.Client, **changes) -> httpx.Response:
    answers = {
        "industry": "Data & Analytics", "skills": ["Python", "SQL"],
        "mentorshipInterests": ["Career Guidance", "Technical Skills"], "availability": "Weekends",
        "biography": "Final-year student interested in data science and machine learning projects.",
        "careerGoals": "I want to become a data scientist in a Nairobi technology company.",
        "academicBackground": "BSc Computer Science", "yearOfStudy": "Fourth Year",
    }
    answers.update(changes)
    return c.put("/api/profile", json=answers)


def latest_list(user_id) -> list:
    with SessionLocal() as db:
        return db.execute(text(
            """SELECT r.mentor_id, r.rank, r.similarity_score, m.max_mentees, p.structured_features AS f,
                      (SELECT count(*) FROM mentorship_requests q
                       WHERE q.mentor_id = r.mentor_id AND q.status = 'ACCEPTED') AS accepted,
                      EXISTS (SELECT 1 FROM mentorship_requests q
                              WHERE q.mentor_id = r.mentor_id AND q.student_id = r.student_id) AS requested
               FROM mentor_recommendations r
               JOIN students s ON s.student_id = r.student_id
               JOIN alumni_mentors m ON m.mentor_id = r.mentor_id
               JOIN profiles p ON p.user_id = m.user_id
               WHERE s.user_id = :u AND r.generated_at =
                 (SELECT max(generated_at) FROM mentor_recommendations WHERE student_id = s.student_id)
               ORDER BY r.rank"""), {"u": user_id}).mappings().all()


def cleanup() -> None:
    db_run("DELETE FROM users WHERE email LIKE 'tc-%@synthetic.test'")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--admin-email", required=True)
    parser.add_argument("--admin-password", required=True)
    args = parser.parse_args()
    base = args.base_url
    cleanup()
    print(f"Running test cases against {base}\n")

    # TC-01: register a student; the user is sent to onboarding.
    student = client(base)
    r = register(student, "tc-01@synthetic.test")
    home = student.get("/student")
    record("TC-01", "FR-01", "Account created; user directed to onboarding",
           f"HTTP {r.status_code}; /student redirects to {home.headers.get('location')}",
           r.status_code == 201 and home.headers.get("location", "").endswith("/student/onboarding"))

    # TC-02: the same email again.
    r = register(client(base), "tc-01@synthetic.test")
    count = db_one("SELECT count(*) AS n FROM users WHERE email = 'tc-01@synthetic.test'")["n"]
    record("TC-02", "FR-01", "Rejected with a clear message; no record created",
           f"HTTP {r.status_code} \"{r.json().get('error')}\"; accounts with that email: {count}",
           r.status_code == 409 and count == 1)

    # TC-03: role ADMIN sent straight to the API.
    r = register(client(base), "tc-03@synthetic.test", role="ADMIN")
    record("TC-03", "FR-01", "Rejected with HTTP 400", f"HTTP {r.status_code} \"{r.json().get('error')}\"",
           r.status_code == 400)

    # TC-04: wrong password.
    r = client(base).post("/api/auth/login", json={"email": "tc-01@synthetic.test", "password": "Wrong1234"})
    issued = "session=" in r.headers.get("set-cookie", "")
    record("TC-04", "FR-01", "General error message; no token issued",
           f"HTTP {r.status_code} \"{r.json().get('error')}\"; session cookie issued: {issued}",
           r.status_code == 401 and not issued)

    # TC-05: administrator route while signed in as a student.
    r = student.get("/api/admin/reports")
    record("TC-05", "NFR-02", "Rejected with HTTP 403", f"HTTP {r.status_code}", r.status_code == 403)

    # TC-06: complete the questionnaire.
    r = onboard(student)
    dims = db_one(
        """SELECT vector_dims(v.embedding_vector) AS e, vector_dims(v.structured_vector) AS s,
                  vector_dims(v.unified_vector) AS u
           FROM users x JOIN profiles p ON p.user_id = x.user_id
           JOIN profile_vectors v ON v.profile_id = p.profile_id
           WHERE x.email = 'tc-01@synthetic.test'""")
    record("TC-06", "FR-03 to FR-05", "Profile saved; vectors stored",
           f"HTTP {r.status_code} {r.json()}; vector dimensions {dict(dims) if dims else None}",
           r.status_code == 200 and r.json().get("vectorsGenerated") is True
           and dims is not None and (dims["e"], dims["s"], dims["u"]) == (384, 44, 428))

    # TC-07: a synthetic student with matching mentors.
    target = db_one("SELECT user_id, (SELECT structured_features FROM profiles p WHERE p.user_id = u.user_id) AS f "
                    "FROM users u WHERE email = 'collins.kamau@synthetic.test'")
    synthetic_student = login(base, "collins.kamau@synthetic.test", SYNTHETIC_PASSWORD)
    page = synthetic_student.get("/student/recommendations")
    rows = latest_list(target["user_id"])
    f = target["f"]
    gate_ok = all(
        row["f"]["industry"] == f["industry"]
        and set(row["f"]["mentorship_interests"]) & set(f["mentorship_interests"])
        and availability_compatible(f["availability"], row["f"]["availability"])
        and row["accepted"] < row["max_mentees"]
        for row in rows
    )
    fresh = [row["similarity_score"] for row in rows if not row["requested"]]
    ordered = fresh == sorted(fresh, reverse=True)
    record("TC-07", "FR-06", "At most k mentors, all passing the gate, in descending score order",
           f"HTTP {page.status_code}; {len(rows)} mentors (k = 5); all pass gate: {gate_ok}; "
           f"descending: {ordered}; scores {[round(s, 3) for s in fresh]}",
           page.status_code == 200 and 0 < len(rows) <= 5 and gate_ok and ordered)

    # TC-08: a student whom no mentor matches.
    lonely = client(base)
    register(lonely, "tc-08@synthetic.test")
    onboard(lonely, industry="Education & Research", mentorshipInterests=["Work-Life Balance"],
            availability="Weekday Mornings")
    page = lonely.get("/student/recommendations")
    advised = "No mentors currently match" in page.text
    record("TC-08", "FR-06", "Empty list with advice to broaden preferences",
           f"HTTP {page.status_code}; advice shown: {advised}", page.status_code == 200 and advised)

    # TC-09: fill the top mentor's last place, then ask again.
    top = rows[0]["mentor_id"]
    before = db_one("SELECT max_mentees FROM alumni_mentors WHERE mentor_id = :m", m=top)["max_mentees"]
    filler = db_one("SELECT student_id FROM students s JOIN users u ON u.user_id = s.user_id "
                    "WHERE u.email = 'tc-08@synthetic.test'")["student_id"]
    db_run("UPDATE alumni_mentors SET max_mentees = 1 WHERE mentor_id = :m", m=top)
    db_run("INSERT INTO mentorship_requests (student_id, mentor_id, status) VALUES (:s, :m, 'ACCEPTED')",
           s=filler, m=top)
    synthetic_student.get("/student/recommendations")
    excluded = top not in [row["mentor_id"] for row in latest_list(target["user_id"])]
    db_run("DELETE FROM mentorship_requests WHERE student_id = :s AND mentor_id = :m", s=filler, m=top)
    db_run("UPDATE alumni_mentors SET max_mentees = :n WHERE mentor_id = :m", n=before, m=top)
    synthetic_student.get("/student/recommendations")
    record("TC-09", "FR-06", "Mentor excluded",
           f"Former rank-1 mentor at capacity (1 of 1) excluded from the new list: {excluded}", excluded)

    # TC-10: a second pending request to the same mentor.
    mentor_row = db_one("SELECT m.mentor_id, u.email FROM alumni_mentors m JOIN users u ON u.user_id = m.user_id "
                        "WHERE u.email = 'michael.waweru@synthetic.test'")
    first = student.post("/api/student/requests", json={"mentorId": str(mentor_row["mentor_id"]),
                                                       "message": "Test request"})
    second = student.post("/api/student/requests", json={"mentorId": str(mentor_row["mentor_id"])})
    record("TC-10", "FR-08", "Rejected",
           f"First HTTP {first.status_code}; second HTTP {second.status_code} \"{second.json().get('error')}\"",
           first.status_code == 201 and second.status_code == 409)

    # TC-11: schedule a session while the request is still pending, then after acceptance.
    request_id = first.json()["requestId"]
    when = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    session_body = {"topic": "Career Guidance", "scheduledDate": when, "duration": 60}
    pending = student.post(f"/api/mentorships/{request_id}/sessions", json=session_body)
    mentor = login(base, mentor_row["email"], SYNTHETIC_PASSWORD)
    accepted = mentor.post(f"/api/mentor/requests/{request_id}", json={"action": "accept"})
    allowed = student.post(f"/api/mentorships/{request_id}/sessions", json=session_body)
    record("TC-11", "FR-09, FR-10", "Rejected; allowed only after acceptance",
           f"While pending HTTP {pending.status_code}; accept HTTP {accepted.status_code}; "
           f"after acceptance HTTP {allowed.status_code}",
           pending.status_code == 409 and accepted.status_code == 200 and allowed.status_code == 201)

    # TC-12: feedback with a rating of 6, then twice for the same session.
    session_id = allowed.json()["sessionId"]
    student.patch(f"/api/sessions/{session_id}", json={"action": "complete"})
    six = student.post("/api/feedback", json={"sessionId": session_id, "relevanceRating": 6, "satisfactionScore": 4})
    ok = student.post("/api/feedback", json={"sessionId": session_id, "relevanceRating": 4, "satisfactionScore": 5})
    twice = student.post("/api/feedback", json={"sessionId": session_id, "relevanceRating": 4, "satisfactionScore": 5})
    record("TC-12", "FR-11", "Both rejected",
           f"Rating 6 HTTP {six.status_code}; valid HTTP {ok.status_code}; second submission HTTP {twice.status_code}",
           six.status_code == 400 and ok.status_code == 201 and twice.status_code == 409)

    # TC-13: report figures against an independent calculation from the raw tables.
    admin = login(base, args.admin_email, args.admin_password)
    report = {row["metric"]: row for row in csv.DictReader(io.StringIO(
        admin.get("/api/admin/reports?synthetic=include").text))}
    with SessionLocal() as db:
        q = lambda sql: db.execute(text(sql)).scalar()  # noqa: E731
        onboarded = "(SELECT s.student_id FROM students s JOIN users u ON u.user_id = s.user_id " \
                    "WHERE u.role = 'STUDENT' AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = s.user_id))"
        recs = q(f"SELECT count(*) FROM mentor_recommendations WHERE student_id IN {onboarded}")
        expected = {
            "click_through_rate": q(f"SELECT count(*) FROM mentor_recommendations WHERE viewed AND student_id IN {onboarded}") / recs,
            "request_rate": q(f"SELECT count(*) FROM mentorship_requests WHERE recommendation_id IS NOT NULL AND student_id IN {onboarded}") / recs,
            "participation": q(f"SELECT count(DISTINCT student_id) FROM mentorship_requests WHERE status = 'ACCEPTED' AND student_id IN {onboarded}")
                             / q(f"SELECT count(*) FROM {onboarded} x"),
        }
    diffs = {k: abs(float(report[k]["value"]) - v) for k, v in expected.items()}
    record("TC-13", "FR-13", "Reported measures equal hand-calculated values",
           "differences " + ", ".join(f"{k} {d:.6f}" for k, d in diffs.items()),
           all(d < 1e-4 for d in diffs.values()))

    # TC-15: every stored password is a bcrypt hash with cost 12.
    with SessionLocal() as db:
        others = db.execute(text(
            r"SELECT email FROM users WHERE password_hash !~ '^\$2[aby]\$12\$.{53}$'")).scalars().all()
        total = db.execute(text("SELECT count(*) FROM users")).scalar()
    record("TC-15", "NFR-03", "Only bcrypt hashes stored",
           f"{total - len(others)} of {total} password hashes are bcrypt (cost 12)"
           + (f"; not bcrypt: {', '.join(others)}" if others else ""), not others)

    cleanup()
    passed = sum(r[4] for r in results)
    print(f"\n{passed} of {len(results)} test cases passed. TC-14: python -m synthetic.load_test. TC-16: by hand.")
    lines = ["| Test case | Requirement | Expected result | Actual result | Result |", "|---|---|---|---|---|"]
    lines += [f"| {c} | {req} | {exp} | {act} | {'Pass' if ok else 'Fail'} |" for c, req, exp, act, ok in results]
    RESULTS_FILE.write_text(f"Run on {datetime.now():%d %b %Y %H:%M}\n\n" + "\n".join(lines) + "\n", encoding="utf-8")
    print(f"Saved to {RESULTS_FILE}")


if __name__ == "__main__":
    main()
