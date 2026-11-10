"""Mentor recommendation endpoint (FR-06, DR-05, IR-02)."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_service_token
from app.services.recommender import (
    MentorCandidate,
    StudentPreferences,
    passes_gate,
    recommend,
)

router = APIRouter(dependencies=[Depends(require_service_token)])

NO_MATCH_MESSAGE = (
    "No mentors currently match your industry, mentorship interests and availability. "
    "Try selecting more mentorship interests or a more flexible availability."
)


class RecommendationOut(BaseModel):
    recommendationId: UUID
    mentorId: UUID
    mentorUserId: UUID
    rank: int
    similarityScore: float
    sharedInterests: list[str]


class RecommendationsResponse(BaseModel):
    studentId: UUID
    generatedAt: datetime | None
    candidatesAfterGate: int
    recommendations: list[RecommendationOut]
    message: str | None = None


STUDENT_QUERY = text(
    """
    SELECT s.student_id, p.structured_features AS features, v.profile_id,
           (v.generated_at >= p.last_updated) AS vectors_current
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    JOIN profiles p ON p.user_id = s.user_id
    LEFT JOIN profile_vectors v ON v.profile_id = p.profile_id
    WHERE s.user_id = :user_id AND u.is_active
    """
)

# Similarity is computed by pgvector: <=> is cosine distance, so 1 - distance
# is cosine similarity between the mentor's and the student's unified vectors.
MENTOR_QUERY = text(
    """
    SELECT m.mentor_id, m.user_id, m.max_mentees, p.structured_features AS features,
           1 - (v.unified_vector <=> (SELECT unified_vector FROM profile_vectors
                                      WHERE profile_id = :student_profile_id)) AS similarity,
           (SELECT count(*) FROM mentorship_requests r
            WHERE r.mentor_id = m.mentor_id AND r.status = 'ACCEPTED') AS active_mentees,
           EXISTS (SELECT 1 FROM mentorship_requests r
                   WHERE r.mentor_id = m.mentor_id AND r.student_id = :student_id) AS already_requested
    FROM alumni_mentors m
    JOIN users u ON u.user_id = m.user_id AND u.is_active
    JOIN profiles p ON p.user_id = m.user_id
    JOIN profile_vectors v ON v.profile_id = p.profile_id
    """
)

# Older lists are kept (not deleted) so click-through history survives for FR-13.
# All rows written in one transaction share the same now(), which marks them
# as one list.
STORE_RECOMMENDATION = text(
    """
    INSERT INTO mentor_recommendations (student_id, mentor_id, similarity_score, rank, generated_at)
    VALUES (:student_id, :mentor_id, :score, :rank, now())
    ON CONFLICT (student_id, mentor_id) DO UPDATE SET
        similarity_score = EXCLUDED.similarity_score,
        rank = EXCLUDED.rank,
        generated_at = now()
    RETURNING recommendation_id, generated_at
    """
)


@router.post("/recommendations/{student_user_id}", response_model=RecommendationsResponse)
def create_recommendations(
    student_user_id: UUID,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Generate, store and return a student's top mentor recommendations."""
    student = db.execute(STUDENT_QUERY, {"user_id": student_user_id}).mappings().one_or_none()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not student["vectors_current"]:
        raise HTTPException(status_code=409, detail="Student profile vectors are not up to date")

    features = student["features"]
    preferences = StudentPreferences(
        industry=features["industry"],
        interests=frozenset(features["mentorship_interests"]),
        availability=features["availability"],
    )
    rows = db.execute(
        MENTOR_QUERY,
        {"student_profile_id": student["profile_id"], "student_id": student["student_id"]},
    ).mappings().all()
    mentors = [
        MentorCandidate(
            mentor_id=str(row["mentor_id"]),
            user_id=str(row["user_id"]),
            industry=row["features"]["industry"],
            interests=frozenset(row["features"]["mentorship_interests"]),
            availability=row["features"]["availability"],
            max_mentees=row["max_mentees"],
            active_mentees=row["active_mentees"],
            similarity=float(row["similarity"]),
            already_requested=row["already_requested"],
        )
        for row in rows
    ]

    results = recommend(preferences, mentors, limit=limit)
    candidates_after_gate = sum(passes_gate(preferences, m) for m in mentors)
    if not results:
        return RecommendationsResponse(
            studentId=student["student_id"], generatedAt=None, candidatesAfterGate=0,
            recommendations=[], message=NO_MATCH_MESSAGE,
        )

    stored = []
    generated_at = None
    for result in results:
        score = max(-1.0, min(1.0, result.mentor.similarity))  # guard against rounding
        row = db.execute(
            STORE_RECOMMENDATION,
            {"student_id": student["student_id"], "mentor_id": result.mentor.mentor_id,
             "score": score, "rank": result.rank},
        ).one()
        generated_at = row.generated_at
        stored.append(
            RecommendationOut(
                recommendationId=row.recommendation_id,
                mentorId=result.mentor.mentor_id,
                mentorUserId=result.mentor.user_id,
                rank=result.rank,
                similarityScore=round(score, 4),
                sharedInterests=list(result.shared_interests),
            )
        )
    db.commit()

    return RecommendationsResponse(
        studentId=student["student_id"], generatedAt=generated_at,
        candidatesAfterGate=candidates_after_gate, recommendations=stored,
    )