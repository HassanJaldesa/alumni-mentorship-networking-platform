"""Profile vector pipeline endpoint (FR-03 to FR-05, DR-03)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.security import require_service_token
from app.services.embedding import encode_text
from app.services.structured import encode_structured
from app.services.vectors import build_unified_vector, to_pgvector

router = APIRouter(dependencies=[Depends(require_service_token)])

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


@router.post("/profiles/{user_id}/vectors")
def generate_profile_vectors(user_id: UUID, db: Session = Depends(get_db)):
    """Build and store the vectors for one user's saved profile.

    Called by Next.js each time a profile is created or updated, so the
    vectors always match the latest answers.
    """
    profile = db.execute(
        text("SELECT profile_id, structured_features, bio_text FROM profiles WHERE user_id = :user_id"),
        {"user_id": user_id},
    ).mappings().one_or_none()
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    bio_text = (profile["bio_text"] or "").strip()
    if not bio_text:
        raise HTTPException(status_code=422, detail="Profile text is empty")
    try:
        structured = encode_structured(profile["structured_features"] or {})
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

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