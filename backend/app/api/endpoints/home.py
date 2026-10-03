"""Health check: lets you (and the hosting service) confirm the API is running."""

from fastapi import APIRouter, Depends

from app.models.health import HealthOut

from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(status="ok")
