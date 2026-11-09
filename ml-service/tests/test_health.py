"""Foundation checks for the recommendation service."""
from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_model_loaded():
    with TestClient(app) as client:  # 'with' runs startup, which loads the model
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "model_loaded": True}


def test_database_and_pgvector_available():
    with TestClient(app) as client:
        response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_embedding_has_384_dimensions():
    from app.services.embedding import encode_text

    vector = encode_text("Final-year student interested in machine learning")
    assert vector.shape == (384,)