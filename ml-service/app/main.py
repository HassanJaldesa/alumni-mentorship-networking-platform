"""FastAPI recommendation service: entry point."""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers import profiles
from app.services.embedding import is_model_loaded, load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()  # load SBERT once at startup so no request waits for it
    yield


app = FastAPI(
    title="Alumni Mentorship Recommendation Service",
    description="Two-layer mentor recommendation engine: structured gate + SBERT cosine similarity.",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(profiles.router)

@app.get("/health")
def health():
    """Service availability check (used for the NFR-07 fallback)."""
    return {"status": "ok", "model_loaded": is_model_loaded()}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    """Confirms the database is reachable and pgvector is enabled."""
    try:
        version = db.execute(
            text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ).scalar_one_or_none()
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if version is None:
        raise HTTPException(status_code=503, detail="pgvector extension not enabled")
    return {"status": "ok", "pgvector": version}