"""Profile vector pipeline endpoint (FR-03 to FR-05, DR-03)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_service_token
from app.services.profile_vectors import ProfileNotFoundError, generate_profile_vectors

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/profiles/{user_id}/vectors")
def create_profile_vectors(user_id: UUID, db: Session = Depends(get_db)):
    """Build and store the vectors for one user's saved profile.

    Called by Next.js each time a profile is created or updated, so the
    vectors always match the latest answers.
    """
    try:
        return generate_profile_vectors(db, user_id)
    except ProfileNotFoundError:
        raise HTTPException(status_code=404, detail="Profile not found")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))