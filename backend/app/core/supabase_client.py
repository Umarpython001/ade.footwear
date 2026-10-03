"""Supabase client, used ONLY for verifying access tokens (auth.get_user).

All database work goes through SQLAlchemy in app/core/database.py, not
through this client. The client is created lazily on first use so that
importing this module never crashes when keys are not set yet.
"""

from supabase import Client, create_client

from app.core.config import get_settings


class AuthNotConfiguredError(RuntimeError):
    """Raised when token verification is attempted without Supabase keys."""


_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        # Service role key if we have one; the publishable (anon) key also
        # works for auth.get_user.
        key = settings.supabase_service_role_key or settings.publishable_key
        if not settings.supabase_url or not key:
            raise AuthNotConfiguredError(
                "SUPABASE_URL and a Supabase key must be set in backend/.env"
            )
        _client = create_client(settings.supabase_url, key)
    return _client
