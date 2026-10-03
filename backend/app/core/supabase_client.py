"""Supabase client, used ONLY for verifying access tokens (auth.get_user).

All database work goes through SQLAlchemy in app/core/database.py, not
through this client. The client is created lazily on first use so that
importing this module never crashes when keys are not set yet.
"""

# Import Client: the supabase-py type for a connected client (used in annotations).
from supabase import Client  # noqa: E402 -- noqa keeps linters from flagging import order here.
# Import create_client: factory that builds a Client from a project URL + API key.
from supabase import create_client  # noqa: E402 -- same package, second name, own comment line.

# Import get_settings: reads backend/.env once into a typed Settings object.
from app.core.config import get_settings


# Define AuthNotConfiguredError: signals "token check attempted with no Supabase keys".
# Subclass RuntimeError so unexpected server-state problems surface as 500s, never silent None.
class AuthNotConfiguredError(RuntimeError):
    # Docstring: documents exactly when this error is raised.
    """Raised when token verification is attempted without Supabase keys."""


# _client: module-level cache for the one shared Supabase client; None means "not built yet".
_client: Client | None = None


# Define get_supabase: return the shared client, building it lazily on first call.
# -> Client: callers always get a ready-to-use client or an exception, never None.
def get_supabase() -> Client:
    # Declare we mean the module-level _client, not a new local variable.
    global _client
    # Only build the client once; afterwards reuse the cached instance.
    if _client is None:
        # Read settings from backend/.env (URL + keys).
        settings = get_settings()
        # Comment: service role key is preferred when present; the publishable (anon) key
        # Comment: also works for auth.get_user, so accept either via `or` fallback.
        key = settings.supabase_service_role_key or settings.publishable_key
        # Guard: refuse to build a client pointing at nothing; fail loudly with a clear message.
        if not settings.supabase_url or not key:
            # Raise our dedicated error so auth.py can turn it into a 500 (server misconfigured).
            raise AuthNotConfiguredError(
                # Message tells the developer exactly which file to fix.
                "SUPABASE_URL and a Supabase key must be set in backend/.env"
            )
        # Build the client from the URL + chosen key and store it in the module cache.
        _client = create_client(settings.supabase_url, key)
    # Return the cached (just-built or long-lived) client to the caller.
    return _client
