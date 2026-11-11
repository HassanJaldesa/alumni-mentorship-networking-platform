"""Two-layer mentor recommendation logic (FR-06).

Layer 1, binary gate: a mentor stays in the candidate pool only if they work
in the student's industry, share at least one mentorship interest, have
compatible availability, and still have room for another mentee.

Layer 2, ranking: candidates are ordered by the cosine similarity of their
unified profile vectors. As a basic diversity measure, mentors the student
has already sent a request to are moved below the others.

These functions take plain data so they can be unit tested without a
database; app/routers/recommendations.py loads the data and stores results.
"""
from dataclasses import dataclass

FLEXIBLE = "Flexible"


@dataclass(frozen=True)
class StudentPreferences:
    industry: str
    interests: frozenset[str]
    availability: str


@dataclass(frozen=True)
class MentorCandidate:
    mentor_id: str
    user_id: str
    industry: str
    interests: frozenset[str]
    availability: str
    max_mentees: int
    active_mentees: int  # accepted mentorships
    similarity: float  # cosine similarity to the student's unified vector
    already_requested: bool = False


@dataclass(frozen=True)
class Recommendation:
    mentor: MentorCandidate
    rank: int
    shared_interests: tuple[str, ...]


def availability_compatible(student: str, mentor: str) -> bool:
    """Same time slot, or either side is flexible."""
    return student == mentor or FLEXIBLE in (student, mentor)


def has_capacity(mentor: MentorCandidate) -> bool:
    return mentor.active_mentees < mentor.max_mentees


def passes_gate(student: StudentPreferences, mentor: MentorCandidate) -> bool:
    """Layer 1: every mandatory compatibility check must pass."""
    return (
        mentor.industry == student.industry
        and bool(student.interests & mentor.interests)
        and availability_compatible(student.availability, mentor.availability)
        and has_capacity(mentor)
    )


def rank_candidates(candidates: list[MentorCandidate]) -> list[MentorCandidate]:
    """Layer 2: highest similarity first, previously requested mentors last."""
    by_similarity = sorted(candidates, key=lambda m: m.similarity, reverse=True)
    return [m for m in by_similarity if not m.already_requested] + [
        m for m in by_similarity if m.already_requested
    ]


def recommend(
    student: StudentPreferences, mentors: list[MentorCandidate], limit: int = 5
) -> list[Recommendation]:
    """Apply the gate, rank the survivors and return the top `limit`."""
    candidates = [m for m in mentors if passes_gate(student, m)]
    ranked = rank_candidates(candidates)[:limit]
    return [
        Recommendation(
            mentor=m,
            rank=position,
            shared_interests=tuple(sorted(student.interests & m.interests)),
        )
        for position, m in enumerate(ranked, start=1)
    ]