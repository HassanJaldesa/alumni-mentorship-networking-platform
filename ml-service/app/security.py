"""Checks that requests come from the Next.js server (IR-03).

Next.js signs a short-lived JWT with the shared SERVICE_TOKEN secret and sends
it in the Authorization header. Requests without a valid token are refused,
so users cannot call the recommendation service directly.
"""
import jwt
from fastapi import Header, HTTPException

from app.config import settings

ISSUER = "nextjs-server"
AUDIENCE = "ml-service"


def require_service_token(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing service token")
    token = authorization.removeprefix("Bearer ")
    try:
        jwt.decode(
            token,
            settings.service_token,
            algorithms=["HS256"],
            audience=AUDIENCE,
            issuer=ISSUER,
            options={"require": ["exp", "iat", "iss", "aud"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid service token")