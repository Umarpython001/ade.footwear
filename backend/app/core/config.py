"""App settings, read from backend/.env.

pydantic-settings fills each field from the environment variable with the same
name (case doesn't matter), so SUPABASE_URL in .env becomes settings.supabase_url.
Values never appear in code or git; only the names do.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found from this file's location so it works from any folder.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    # Frontend URLs allowed to call this API from a browser (CORS),
    # comma-separated: "http://localhost:5173,https://ade.vercel.app".
    allowed_origins: str = "http://localhost:5173"

    # Filled in at step 2 (Supabase) and step 6 (Mailgun) of BACKEND_PLAN.md.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    # Public anon/publishable key. Used to verify user tokens when no service
    # role key is set (auth.get_user works with either).
    publishable_key: str = ""
    direct_connection_string : str = ""
    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    mailgun_from: str = ""
    owner_notify_email: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Read .env once and reuse the same Settings object everywhere."""
    return Settings()
