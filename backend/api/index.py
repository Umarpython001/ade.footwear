"""Vercel entrypoint. Vercel runs files in api/ as serverless functions and
hands requests to the exported ASGI `app`.
"""

# Import sys: lets us add backend/ to Python's module search path at runtime.
import sys
# Import Path: object-oriented paths; used to compute backend/'s location from this file.
from pathlib import Path

# Comment: make the backend/ folder importable so `from app...` resolves on Vercel.
# __file__ = this file (api/index.py); .parents[1] climbs api/ -> backend/; insert(0, ...) puts it first.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Import app: the FastAPI application built in app/main.py; Vercel serves it as the function.
from app.main import app  # noqa: E402, F401 -- E402 (import after code) is required here; F401 keeps it exported.
