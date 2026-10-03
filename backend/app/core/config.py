"""App settings, read from backend/.env.

pydantic-settings fills each field from the environment variable with the same
name (case doesn't matter), so SUPABASE_URL in .env becomes settings.supabase_url.
Values never appear in code or git; only the names do.
"""

# Import lru_cache: memoizes get_settings() so .env is read once and reused everywhere.
from functools import lru_cache
# Import Path: object-oriented filesystem paths; used to locate backend/.env reliably.
from pathlib import Path

# Import BaseSettings: pydantic class that fills fields from environment variables + .env file.
from pydantic_settings import BaseSettings  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import SettingsConfigDict: config dict for BaseSettings (tells it which env file to read).
from pydantic_settings import SettingsConfigDict  # noqa: E402 -- same package, second name, own comment.

# ENV_FILE: absolute path to backend/.env, derived from THIS file's location (core/config.py -> up 2 = backend/).
# Works no matter which folder uvicorn/pytest is launched from.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


# Define Settings: one typed object holding every secret/setting the app needs.
# Inherits BaseSettings so each field auto-fills from the same-named env var (case-insensitive).
class Settings(BaseSettings):
    # model_config: tells pydantic-settings to also read the ENV_FILE above...
    # ...and to silently ignore extra .env names we don't declare (extra="ignore").
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    # Comment: which browser origins may call this API (CORS), as one comma-separated string.
    # Comment: the deployed frontend URL belongs in .env, not here.
    # Comment: e.g. ALLOWED_ORIGINS=http://localhost:5173,https://<your-vercel-site>
    # Comment: an .env value REPLACES this default entirely (no merging), so it must
    # Comment: also include http://localhost:5173 or local development breaks.
    # allowed_origins: the raw string; cors_origins below splits it into a list.
    allowed_origins: str = "http://localhost:5173"

    # Comment: which build step fills each secret (see BACKEND_PLAN.md); empty means "not set yet".
    # supabase_url: the Supabase project URL, e.g. https://<ref>.supabase.co.
    supabase_url: str = ""
    # supabase_service_role_key: the master key; lives ONLY in backend/.env, never in git/frontend.
    supabase_service_role_key: str = ""
    # Comment: public anon/publishable key. Used to verify user tokens when no service
    # Comment: role key is set (auth.get_user works with either). -- I added this setting.
    # publishable_key: safe to expose; the frontend uses the same value as VITE_SUPABASE_ANON_KEY.
    publishable_key: str = ""
    # direct_connection_string: SQLAlchemy Postgres URL (pooler, port 6543) for all DB work.
    direct_connection_string : str = ""
    # mailgun_api_key: secret for sending order emails (step 6, currently unused).
    mailgun_api_key: str = ""
    # mailgun_domain: the Mailgun sending domain for order emails.
    mailgun_domain: str = ""
    # mailgun_from: the From: address customers see on order emails.
    mailgun_from: str = ""
    # owner_notify_email: optional copy-recipient for every order email.
    owner_notify_email: str = ""

    # @property makes cors_origins behave like a read-only attribute: settings.cors_origins.
    @property
    # Define cors_origins: split the comma string into a clean list for CORSMiddleware.
    # -> list[str]: e.g. ["http://localhost:5173", "https://site.vercel.app"].
    def cors_origins(self) -> list[str]:
        # Split on commas, strip whitespace, drop empties: "a, b," -> ["a", "b"].
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


# @lru_cache with no args: run get_settings() once, return the same object on every later call.
@lru_cache
# Define get_settings: the single entry point every module uses to read configuration.
# -> Settings: the cached, fully-populated settings object.
def get_settings() -> Settings:
    # Docstring: explains the caching behaviour to future readers.
    """Read .env once and reuse the same Settings object everywhere."""
    # Build (first call) or fetch (later calls) the Settings from env + .env file.
    return Settings()
