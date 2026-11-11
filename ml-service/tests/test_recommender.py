"""Unit tests for the two-layer recommendation logic (FR-06), no database."""
from app.services.recommender import (
    MentorCandidate,
    StudentPreferences,
    availability_compatible,
    passes_gate,
    rank_candidates,
    recommend,
)

STUDENT = StudentPreferences(
    industry="Data & Analytics",
    interests=frozenset({"Career Guidance", "Technical Skills"}),
    availability="Weekends",
)


def mentor(mentor_id: str, similarity: float = 0.5, **changes) -> MentorCandidate:
    values = dict(
        mentor_id=mentor_id, user_id=f"user-{mentor_id}", industry="Data & Analytics",
        interests=frozenset({"Technical Skills"}), availability="Weekends",
        max_mentees=3, active_mentees=0, similarity=similarity, already_requested=False,
    )
    values.update(changes)
    return MentorCandidate(**values)


# ---------- layer 1: binary gate ----------

def test_compatible_mentor_passes_gate():
    assert passes_gate(STUDENT, mentor("a"))


def test_different_industry_fails_gate():
    assert not passes_gate(STUDENT, mentor("a", industry="Healthcare"))


def test_no_shared_interest_fails_gate():
    assert not passes_gate(STUDENT, mentor("a", interests=frozenset({"Entrepreneurship"})))


def test_incompatible_availability_fails_gate():
    assert not passes_gate(STUDENT, mentor("a", availability="Weekday Mornings"))


def test_flexible_is_compatible_with_any_slot():
    assert availability_compatible("Weekends", "Flexible")
    assert availability_compatible("Flexible", "Weekday Evenings")
    assert not availability_compatible("Weekends", "Weekday Evenings")


def test_mentor_at_capacity_fails_gate():
    assert not passes_gate(STUDENT, mentor("a", max_mentees=2, active_mentees=2))
    assert passes_gate(STUDENT, mentor("b", max_mentees=2, active_mentees=1))


# ---------- layer 2: ranking and diversity ----------

def test_candidates_ranked_by_similarity_descending():
    ranked = rank_candidates([mentor("low", 0.2), mentor("high", 0.9), mentor("mid", 0.5)])
    assert [m.mentor_id for m in ranked] == ["high", "mid", "low"]


def test_previously_requested_mentor_moves_below_others():
    ranked = rank_candidates([mentor("asked", 0.95, already_requested=True), mentor("new", 0.4)])
    assert [m.mentor_id for m in ranked] == ["new", "asked"]


# ---------- full recommend() ----------

def test_recommend_returns_top_five_with_ranks():
    mentors = [mentor(str(i), similarity=i / 10) for i in range(8)]
    results = recommend(STUDENT, mentors, limit=5)
    assert [r.mentor.mentor_id for r in results] == ["7", "6", "5", "4", "3"]
    assert [r.rank for r in results] == [1, 2, 3, 4, 5]


def test_recommend_excludes_gate_failures_even_if_very_similar():
    results = recommend(STUDENT, [mentor("other-industry", 0.99, industry="Healthcare"), mentor("ok", 0.1)])
    assert [r.mentor.mentor_id for r in results] == ["ok"]


def test_recommend_reports_shared_interests():
    result = recommend(STUDENT, [mentor("a", interests=frozenset({"Technical Skills", "Graduate Studies"}))])[0]
    assert result.shared_interests == ("Technical Skills",)


def test_no_candidates_returns_empty_list():
    assert recommend(STUDENT, []) == []
    assert recommend(STUDENT, [mentor("a", industry="Healthcare")]) == []