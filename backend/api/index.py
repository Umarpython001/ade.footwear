"""Vercel entrypoint. Vercel runs files in api/ as serverless functions and
hands requests to the exported ASGI `app`.
"""

import sys
from pathlib import Path

# Make the backend/ folder importable so `from app...` resolves on Vercel.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402, F401
