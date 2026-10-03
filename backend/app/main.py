"""Entry point. Run from the backend folder:

    venv\\Scripts\\activate
    uvicorn app.main:app --reload

Then open http://localhost:8000/docs for interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import get_settings


from app.core.database import engine, Base

# Import the table definitions so Base.metadata knows about them before create_all.
from app.schemas import orders, products  # noqa: F401

Base.metadata.create_all(bind=engine)

settings = get_settings()

app = FastAPI(title="ADE Foot Wear API", version="0.1.0")

# CORS: browsers only let the frontend call this API if its origin is listed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)

app.include_router(api_router)
