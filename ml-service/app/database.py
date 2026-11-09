"""Database engine and session handling (IR-04)."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Open a database session for one request and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()