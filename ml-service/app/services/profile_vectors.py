"""Builds and stores the vectors for one saved profile (DR-03).

Used by the API endpoint and by the synthetic data loader, so both follow
exactly the same steps.
"""
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.services.embedding import encode_text
from app.services.structured import encode_structured
from app.services.vectors import build_unified_vector, to_pgvector


class ProfileNotFoundError(Exception):
    """The user has no saved profile."""


UPSERT_VECTORS = text(
    """
    INSERT INTO profile_vectors
        (profile_id, embedding_vector, structured_vector, unified_vector, model_name, generated_at)
    VALUES
        (:profile_id, CAST(:embedding AS vector), CAST(:structured AS vector),
         CAST(:unified AS vector), :model_name, now())
    ON CONFLICT (profile_id) DO UPDATE SET
        embedding_vector  = EXCLUDED.embedding_vector,
        structured_vector = EXCLUDED.structured_vector,
        unified_vector    = EXCLUDED.unified_vector,
        model_name        = EXCLUDED.model_name,
        generated_at      = now()
    """
)


def generate_profile_vectors(db: Session, user_id: UUID) -> dict:
    """Encode one user's profile and store the result.

    Raises ProfileNotFoundError if there is no profile, and ValueError if the
    profile text is empty or an answer is not in the vocabulary.
    """
    profile = db.execute(
        text("SELECT profile_id, structured_features, bio_text FROM profiles WHERE user_id = :user_id"),
        {"user_id": user_id},
    ).mappings().one_or_none()
    if profile is None:
        raise ProfileNotFoundError(str(user_id))

    bio_text = (profile["bio_text"] or "").strip()
    if not bio_text:
        raise ValueError("Profile text is empty")
    structured = encode_structured(profile["structured_features"] or {})
    embedding = encode_text(bio_text)
    unified = build_unified_vector(embedding, structured)

    db.execute(
        UPSERT_VECTORS,
        {
            "profile_id": profile["profile_id"],
            "embedding": to_pgvector(embedding),
            "structured": to_pgvector(structured),
            "unified": to_pgvector(unified),
            "model_name": settings.sbert_model,
        },
    )
    db.commit()

    return {
        "profileId": str(profile["profile_id"]),
        "modelName": settings.sbert_model,
        "dimensions": {
            "embedding": len(embedding),
            "structured": len(structured),
            "unified": len(unified),
        },
    }