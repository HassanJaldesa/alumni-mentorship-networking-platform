"""Shared test helpers."""
import time

import jwt
import pytest

from app.config import settings
from app.security import AUDIENCE, ISSUER


def make_service_token(secret: str | None = None, expires_in: int = 60) -> str:
    """Create a token like the one Next.js sends (IR-03)."""
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER, "aud": AUDIENCE, "iat": now, "exp": now + expires_in},
        secret or settings.service_token,
        algorithm="HS256",
    )


@pytest.fixture
def service_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {make_service_token()}"}