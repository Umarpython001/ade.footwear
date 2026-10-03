"""Answers "who is asking?" for signed-in endpoints.

The frontend sends the Supabase access token as `Authorization: Bearer <token>`.
We ask Supabase whether the token is real and whose it is. The user id ALWAYS
comes from the verified token, never from the request body.
"""

from dataclasses import dataclass

from fastapi import Header, HTTPException

from app.core.supabase_client import AuthNotConfiguredError, get_supabase


@dataclass
class CurrentUser:
    id: str
    email: str


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header (expected 'Bearer <token>').",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty access token.")

    try:
        response = get_supabase().auth.get_user(token)
    except AuthNotConfiguredError as exc:
        # Server misconfiguration, not the client's fault.
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.") from exc

    user = getattr(response, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")

    return CurrentUser(id=str(user.id), email=getattr(user, "email", "") or "")
