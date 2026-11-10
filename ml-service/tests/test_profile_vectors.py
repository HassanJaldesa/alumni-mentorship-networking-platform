"""Tests for the profile vector pipeline (FR-03 to FR-05, DR-03, IR-03)."""
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import SessionLocal
from app.main import app
from app.services.structured import encode_structured
from app.services.vectors import build_unified_vector
from tests.conftest import make_service_token

FEATURES = {
    "industry": "Data & Analytics",
    "skills": ["Python", "SQL", "Machine Learning"],
    "mentorship_interests": ["Career Guidance", "Technical Skills"],
    "availability": "Weekends",
}
TEST_EMAIL = "vector.test@synthetic.test"


# ---------- structured encoding ----------

def test_structured_vector_has_44_positions_and_correct_ones():
    vector = encode_structured(FEATURES)
    assert vector.shape == (44,)
    # 1 industry + 3 skills + 2 interests + 1 availability
    assert vector.sum() == 7
    assert vector[5] == 1  # "Data & Analytics" is the 6th industry
    assert vector[10] == 1  # "Python" is the first skill (positions 10-29)


def test_unknown_value_is_rejected():
    with pytest.raises(ValueError, match="Unknown skill"):
        encode_structured({**FEATURES, "skills": ["Pyhton"]})


def test_missing_industry_is_rejected():
    with pytest.raises(ValueError, match="Industry is required"):
        encode_structured({**FEATURES, "industry": None})


# ---------- unified vector ----------

def test_unified_vector_is_unit_length_with_428_dimensions():
    embedding = np.random.default_rng(1).normal(size=384).astype(np.float32)
    unified = build_unified_vector(embedding, encode_structured(FEATURES))
    assert unified.shape == (428,)
    assert np.isclose(np.linalg.norm(unified), 1.0, atol=1e-5)


def test_text_and_structure_count_equally():
    rng = np.random.default_rng(2)
    text_a, text_b = rng.normal(size=384), rng.normal(size=384)
    struct_a = encode_structured(FEATURES)
    struct_b = encode_structured({**FEATURES, "industry": "Healthcare"})

    def cosine(x, y):
        return float(np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y)))

    expected = 0.5 * cosine(text_a, text_b) + 0.5 * cosine(struct_a, struct_b)
    actual = cosine(build_unified_vector(text_a, struct_a), build_unified_vector(text_b, struct_b))
    assert np.isclose(actual, expected, atol=1e-5)


# ---------- service token (IR-03) ----------

def test_request_without_token_is_refused():
    with TestClient(app) as client:
        response = client.post("/profiles/00000000-0000-0000-0000-000000000000/vectors")
    assert response.status_code == 401


def test_token_signed_with_wrong_secret_is_refused():
    headers = {"Authorization": f"Bearer {make_service_token(secret='x' * 64)}"}
    with TestClient(app) as client:
        response = client.post("/profiles/00000000-0000-0000-0000-000000000000/vectors", headers=headers)
    assert response.status_code == 401


def test_expired_token_is_refused():
    headers = {"Authorization": f"Bearer {make_service_token(expires_in=-10)}"}
    with TestClient(app) as client:
        response = client.post("/profiles/00000000-0000-0000-0000-000000000000/vectors", headers=headers)
    assert response.status_code == 401


def test_unknown_user_returns_404(service_headers):
    with TestClient(app) as client:
        response = client.post("/profiles/00000000-0000-0000-0000-000000000000/vectors", headers=service_headers)
    assert response.status_code == 404


# ---------- full pipeline against the database ----------

@pytest.fixture
def saved_profile():
    """Insert a synthetic user and profile, and remove them after the test."""
    with SessionLocal() as db:
        db.execute(text("DELETE FROM users WHERE email = :email"), {"email": TEST_EMAIL})
        user_id = db.execute(
            text(
                """INSERT INTO users (first_name, last_name, email, password_hash, role)
                   VALUES ('Vector', 'Test', :email, 'not-a-real-hash', 'STUDENT')
                   RETURNING user_id"""
            ),
            {"email": TEST_EMAIL},
        ).scalar_one()
        db.execute(
            text(
                """INSERT INTO profiles (user_id, structured_features, bio_text)
                   VALUES (:user_id, CAST(:features AS jsonb), :bio)"""
            ),
            {
                "user_id": user_id,
                "features": json.dumps(FEATURES),
                "bio": "Final-year student interested in data science and machine learning.",
            },
        )
        db.commit()
    yield user_id
    with SessionLocal() as db:
        db.execute(text("DELETE FROM users WHERE email = :email"), {"email": TEST_EMAIL})
        db.commit()


def test_vectors_are_generated_and_stored(saved_profile, service_headers):
    with TestClient(app) as client:
        response = client.post(f"/profiles/{saved_profile}/vectors", headers=service_headers)
        assert response.status_code == 200
        assert response.json()["dimensions"] == {"embedding": 384, "structured": 44, "unified": 428}

        # Calling again updates the same row instead of adding a second one.
        assert client.post(f"/profiles/{saved_profile}/vectors", headers=service_headers).status_code == 200

    with SessionLocal() as db:
        rows = db.execute(
            text(
                """SELECT vector_dims(v.embedding_vector) AS e, vector_dims(v.structured_vector) AS s,
                          vector_dims(v.unified_vector) AS u, v.model_name
                   FROM profile_vectors v JOIN profiles p ON p.profile_id = v.profile_id
                   WHERE p.user_id = :user_id"""
            ),
            {"user_id": saved_profile},
        ).mappings().all()
    assert len(rows) == 1
    assert (rows[0]["e"], rows[0]["s"], rows[0]["u"]) == (384, 44, 428)
    assert rows[0]["model_name"] == "all-MiniLM-L6-v2"