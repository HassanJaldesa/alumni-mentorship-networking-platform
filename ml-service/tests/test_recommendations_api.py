"""Integration tests for POST /recommendations/{student_user_id} (FR-06, DR-05)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import SessionLocal
from app.main import app
from app.services.profile_vectors import generate_profile_vectors
from synthetic.load import load_mentor, load_student
from synthetic.profiles import MentorSpec, StudentSpec

PATTERN = "%rectest%@synthetic.test"

STUDENT = StudentSpec(
    "Rectest", "Student", "BSc Electrical Engineering", "Fourth Year", "Energy & Utilities",
    ("Python", "Data Analysis"), ("Technical Skills", "Career Guidance"), "Weekends",
    "Engineering student building solar monitoring dashboards with Python.",
    "I want to design renewable energy systems for rural communities.",
)
OTHER_STUDENT = StudentSpec(
    "Rectest", "Other", "BSc Electrical Engineering", "Third Year", "Energy & Utilities",
    ("Python",), ("Technical Skills",), "Weekends",
    "Engineering student interested in power systems and electric vehicles.",
    "I want to work on electric mobility projects in Nairobi.",
)


def make_mentor(last_name: str, **changes) -> MentorSpec:
    values = dict(
        first_name="Rectest", last_name=last_name, years_of_experience=8,
        industry="Energy & Utilities", skills=("Python", "Data Analysis"),
        interests=("Technical Skills",), availability="Weekends",
        summary="Solar energy engineer designing mini-grids and monitoring systems for villages.",
        focus="Helping engineering students start careers in renewable energy.",
    )
    values.update(changes)
    return MentorSpec(**values)


def remove_test_users():
    with SessionLocal() as db:
        db.execute(text("DELETE FROM users WHERE email LIKE :p"), {"p": PATTERN})
        db.commit()


@pytest.fixture
def dataset():
    """A student and four mentors: one good match, one in another industry,
    one with no free places, and one the student has already asked."""
    remove_test_users()
    with SessionLocal() as db:
        ids = {
            "student": load_student(db, STUDENT, "not-a-real-hash"),
            "other": load_student(db, OTHER_STUDENT, "not-a-real-hash"),
            "match": load_mentor(db, make_mentor("Match"), "not-a-real-hash"),
            "industry": load_mentor(db, make_mentor("Industry", industry="Healthcare"), "not-a-real-hash"),
            "full": load_mentor(db, make_mentor("Full", max_mentees=1), "not-a-real-hash"),
            "asked": load_mentor(db, make_mentor("Asked"), "not-a-real-hash"),
        }
        db.commit()
        for user_id in ids.values():
            generate_profile_vectors(db, user_id)

        def role_id(table, column, user_id):
            return db.execute(text(f"SELECT {column} FROM {table} WHERE user_id = :u"), {"u": user_id}).scalar_one()

        student_id = role_id("students", "student_id", ids["student"])
        other_id = role_id("students", "student_id", ids["other"])
        # "full" already has one accepted mentee; "asked" has a pending request from the student.
        db.execute(
            text("INSERT INTO mentorship_requests (student_id, mentor_id, status) VALUES (:s, :m, 'ACCEPTED')"),
            {"s": other_id, "m": role_id("alumni_mentors", "mentor_id", ids["full"])},
        )
        db.execute(
            text("INSERT INTO mentorship_requests (student_id, mentor_id, status) VALUES (:s, :m, 'PENDING')"),
            {"s": student_id, "m": role_id("alumni_mentors", "mentor_id", ids["asked"])},
        )
        db.commit()
    yield ids
    remove_test_users()


def test_recommendations_apply_gate_capacity_and_diversity(dataset, service_headers):
    with TestClient(app) as client:
        response = client.post(f"/recommendations/{dataset['student']}?limit=20", headers=service_headers)
    assert response.status_code == 200
    body = response.json()
    returned = [r["mentorUserId"] for r in body["recommendations"]]

    assert str(dataset["match"]) in returned
    assert str(dataset["industry"]) not in returned  # failed the gate
    assert str(dataset["full"]) not in returned  # no free places
    assert returned[-1] == str(dataset["asked"])  # already requested, so moved last
    assert [r["rank"] for r in body["recommendations"]] == list(range(1, len(returned) + 1))
    assert all(-1 <= r["similarityScore"] <= 1 for r in body["recommendations"])


def test_recommendations_are_stored_and_updated_not_duplicated(dataset, service_headers):
    with TestClient(app) as client:
        first = client.post(f"/recommendations/{dataset['student']}", headers=service_headers).json()
        second = client.post(f"/recommendations/{dataset['student']}", headers=service_headers).json()
    assert len(first["recommendations"]) == len(second["recommendations"]) <= 5

    with SessionLocal() as db:
        stored = db.execute(
            text(
                """SELECT count(*) FROM mentor_recommendations r
                   JOIN students s ON s.student_id = r.student_id WHERE s.user_id = :u"""
            ),
            {"u": dataset["student"]},
        ).scalar_one()
    assert stored == len(second["recommendations"])


def test_request_without_token_is_refused(dataset):
    with TestClient(app) as client:
        assert client.post(f"/recommendations/{dataset['student']}").status_code == 401


def test_unknown_student_returns_404(service_headers):
    with TestClient(app) as client:
        response = client.post(
            "/recommendations/00000000-0000-0000-0000-000000000000", headers=service_headers
        )
    assert response.status_code == 404