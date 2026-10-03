"""Entry point. Run from the backend folder:

    venv\\Scripts\\activate
    uvicorn app.main:app --reload

Then open http://localhost:8000/docs for interactive API docs.
"""

# Import FastAPI: the web framework class; app = FastAPI(...) below is the ASGI application.
from fastapi import FastAPI
# Import CORSMiddleware: browser security gate; only listed origins may call the API from a page.
from fastapi.middleware.cors import CORSMiddleware

# Import api_router: the single collector that bundles every endpoint group (health, products, orders).
from app.api.routes import api_router
# Import get_settings: reads backend/.env into the typed Settings object (CORS origins come from it).
from app.core.config import get_settings


# Import engine: the SQLAlchemy connection engine to Supabase Postgres (built from DIRECT_CONNECTION_STRING).
from app.core.database import engine  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import Base: the declarative base every DB model inherits from; its metadata knows all tables.
from app.core.database import Base  # noqa: E402 -- same module, second name, own comment.

# Comment: import the table definitions so Base.metadata knows about them before create_all.
# Import orders: registers the orders + order_items tables on Base.metadata (unused name is intentional).
from app.schemas import orders  # noqa: F401 -- F401 = "imported but unused" is expected here.
# Import products: registers the products table on Base.metadata the same way.
from app.schemas import products  # noqa: F401 -- second table module, own comment line.

# Create any missing tables on startup (no-op when they already exist); runs once at import.
Base.metadata.create_all(bind=engine)

# Load settings now (cached afterwards); used for CORS below.
settings = get_settings()

# Create the FastAPI application: title/version appear in /docs.
app = FastAPI(title="ADE Foot Wear API", version="0.1.0")

# Comment: CORS: browsers only let the frontend call this API if its origin is listed.
# Attach the CORS middleware to the app.
app.add_middleware(
    # CORSMiddleware: the middleware class handling Origin checks + preflight requests.
    CORSMiddleware,
    # allow_origins: exact origins allowed (from ALLOWED_ORIGINS in .env); others get no ACAO header.
    # (I changed this line back from allow_origins=["*"] so the CORS tests pass.)
    allow_origins=settings.cors_origins,
    # allow_methods: browsers may use GET (reading) and POST (checkout) cross-origin; nothing else.
    allow_methods=["GET", "POST"],
    # allow_headers: the custom headers browsers may send: auth token, JSON type, idempotency key.
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)

# Mount every endpoint group (health, products, orders) onto the app.
app.include_router(api_router)
