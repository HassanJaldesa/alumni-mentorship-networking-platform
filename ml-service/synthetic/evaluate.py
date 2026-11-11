"""Evaluate the recommendation engine on the 20 synthetic scenarios (DR-04).

Run from the ml-service folder after `python -m synthetic.load`:

    python -m synthetic.evaluate

Four configurations are compared (Table 5.4):
  Random           five mentors drawn at random from all mentors (mean of 10 runs)
  Structured-only  gate-passing mentors ranked by the number of shared attributes
  Semantic-only    SBERT text similarity over all mentors, no gate
  Hybrid           the platform's engine: gate, then unified-vector similarity
                   (called through the real API endpoint)

Metrics, all over the top five:
  Precision@5  share of the five that are intended matches (best possible 0.6,
               because each scenario has three intended mentors)
  Recall@5     share of the three intended mentors that appear
  Hit Rate@5   share of scenarios with at least one intended mentor
"""
import json
import random
import statistics
import time
from pathlib import Path

import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import SessionLocal
from app.main import app
from app.services.recommender import MentorCandidate, StudentPreferences, passes_gate
from synthetic.profiles import SCENARIOS
from tests.conftest import make_service_token

TOP_K = 5
SEED = 42
RANDOM_RUNS = 10
RESULTS_FILE = Path(__file__).parent / "evaluation_results.json"

PROFILE_QUERY = text(
    """
    SELECT u.user_id, u.email, p.structured_features AS f,
           CAST(v.embedding_vector AS text) AS embedding, CAST(v.unified_vector AS text) AS unified
    FROM users u
    JOIN profiles p ON p.user_id = u.user_id
    JOIN profile_vectors v ON v.profile_id = p.profile_id
    WHERE u.email LIKE '%@synthetic.test' AND u.role = :role
    """
)


def parse_vector(value: str) -> np.ndarray:
    return np.array(json.loads(value), dtype=np.float32)


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def load_profiles(db, role: str) -> dict[str, dict]:
    rows = db.execute(PROFILE_QUERY, {"role": role}).mappings().all()
    return {
        row["email"]: {
            "user_id": str(row["user_id"]),
            "features": row["f"],
            "embedding": parse_vector(row["embedding"]),
            "unified": parse_vector(row["unified"]),
        }
        for row in rows
    }


def preferences(features: dict) -> StudentPreferences:
    return StudentPreferences(features["industry"], frozenset(features["mentorship_interests"]),
                              features["availability"])


def candidate(email: str, features: dict) -> MentorCandidate:
    return MentorCandidate(email, email, features["industry"], frozenset(features["mentorship_interests"]),
                           features["availability"], max_mentees=3, active_mentees=0, similarity=0.0)


def shared_attributes(student: dict, mentor: dict) -> int:
    """Structured-only score: shared skills + shared interests + industry + availability."""
    return (
        len(set(student["skills"]) & set(mentor["skills"]))
        + len(set(student["mentorship_interests"]) & set(mentor["mentorship_interests"]))
        + int(student["industry"] == mentor["industry"])
        + int(student["availability"] == mentor["availability"])
    )


def score(top: list[str], intended: set[str]) -> tuple[float, float, float]:
    hits = len(set(top[:TOP_K]) & intended)
    return hits / TOP_K, hits / len(intended), float(hits > 0)


def summarise(name: str, rows: list[tuple[float, float, float]], times_ms: list[float]) -> dict:
    return {
        "configuration": name,
        "precision_at_5": round(statistics.mean(r[0] for r in rows), 3),
        "recall_at_5": round(statistics.mean(r[1] for r in rows), 3),
        "hit_rate_at_5": round(statistics.mean(r[2] for r in rows), 3),
        "mean_response_ms": round(statistics.mean(times_ms), 1),
    }


def main() -> None:
    rng = random.Random(SEED)
    with SessionLocal() as db:
        students = load_profiles(db, "STUDENT")
        mentors = load_profiles(db, "ALUMNI_MENTOR")
    if len(mentors) != 70 or len(students) != 30:
        raise SystemExit("Synthetic data not found. Run: python -m synthetic.load")
    mentor_emails = sorted(mentors)

    results = {name: [] for name in ("Random", "Structured-only", "Semantic-only", "Hybrid")}
    times = {name: [] for name in results}
    missed = []
    headers = {"Authorization": f"Bearer {make_service_token(expires_in=600)}"}

    with TestClient(app) as client:
        for scenario in SCENARIOS:
            student = students[scenario.student.email]
            intended = {m.email for m in scenario.intended_mentors}
            prefs = preferences(student["features"])

            # Random: mean of 10 draws over all mentors.
            start = time.perf_counter()
            draws = [score(rng.sample(mentor_emails, TOP_K), intended) for _ in range(RANDOM_RUNS)]
            times["Random"].append((time.perf_counter() - start) * 1000 / RANDOM_RUNS)
            results["Random"].append(tuple(statistics.mean(d[i] for d in draws) for i in range(3)))

            # Structured-only: gate, then most shared attributes (ties broken at random).
            start = time.perf_counter()
            pool = [e for e in mentor_emails if passes_gate(prefs, candidate(e, mentors[e]["features"]))]
            ranked = sorted(pool, key=lambda e: (-shared_attributes(student["features"], mentors[e]["features"]),
                                                 rng.random()))
            times["Structured-only"].append((time.perf_counter() - start) * 1000)
            results["Structured-only"].append(score(ranked, intended))

            # Semantic-only: SBERT similarity of the text, every mentor, no gate.
            start = time.perf_counter()
            ranked = sorted(mentor_emails, key=lambda e: -cosine(student["embedding"], mentors[e]["embedding"]))
            times["Semantic-only"].append((time.perf_counter() - start) * 1000)
            results["Semantic-only"].append(score(ranked, intended))

            # Hybrid: the real endpoint.
            start = time.perf_counter()
            response = client.post(f"/recommendations/{student['user_id']}", headers=headers)
            times["Hybrid"].append((time.perf_counter() - start) * 1000)
            response.raise_for_status()
            by_user = {m["user_id"]: e for e, m in mentors.items()}
            top = [by_user[r["mentorUserId"]] for r in response.json()["recommendations"]]
            results["Hybrid"].append(score(top, intended))
            if set(intended) - set(top):
                missed.append({
                    "scenario": scenario.scenario_id,
                    "description": scenario.description,
                    "gate_pool_size": len(pool),
                    "missed": sorted(intended - set(top)),
                    "ranked_above_them": [e for e in top if e not in intended],
                })

    summary = [summarise(name, results[name], times[name]) for name in results]
    print(f"\nRecommendation engine evaluation (n = {len(SCENARIOS)} scenarios, top {TOP_K})\n")
    print(f"{'Configuration':<17}{'Precision@5':>12}{'Recall@5':>10}{'Hit Rate@5':>12}{'Mean ms':>10}")
    for row in summary:
        print(f"{row['configuration']:<17}{row['precision_at_5']:>12.3f}{row['recall_at_5']:>10.3f}"
              f"{row['hit_rate_at_5']:>12.3f}{row['mean_response_ms']:>10.1f}")
    print("\nPrecision@5 cannot exceed 0.6 here: each scenario has three intended mentors.")
    print("Hybrid time includes the API call and database queries; the others are in-memory only.")
    print(f"\nHybrid scenarios with a missed intended mentor: {len(missed)}")
    for item in missed:
        print(f"  {item['scenario']} ({item['description']}), pool {item['gate_pool_size']}: "
              f"missed {', '.join(item['missed'])}; ranked higher: {', '.join(item['ranked_above_them'])}")

    RESULTS_FILE.write_text(json.dumps({"summary": summary, "hybrid_misses": missed}, indent=2))
    print(f"\nSaved to {RESULTS_FILE}")


if __name__ == "__main__":
    main()