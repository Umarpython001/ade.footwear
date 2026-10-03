"""Answers "who is asking?" for signed-in endpoints.

The frontend sends the Supabase access token as `Authorization: Bearer <token>`.
We ask Supabase whether the token is real and whose it is. The user id ALWAYS
comes from the verified token, never from the request body.
"""

# Import dataclass: a decorator that turns a plain class into a value holder
# with auto-generated __init__/__eq__/__repr__, so CurrentUser(id, email) works.
from dataclasses import dataclass

# Import Header: reads one HTTP header into a function argument as a dependency.
from fastapi import Header  # noqa: E402 -- noqa keeps linters from flagging import order here.
# Import HTTPException: FastAPI's way to abort a request with a status + message.
from fastapi import HTTPException  # noqa: E402 -- separate line so each import gets its own comment.

# Import AuthNotConfiguredError: raised when Supabase keys are missing from .env.
from app.core.supabase_client import AuthNotConfiguredError  # noqa: E402 -- our lazy Supabase client module.
# Import get_supabase: returns the shared Supabase client, creating it on first use.
from app.core.supabase_client import get_supabase  # noqa: E402 -- same module, second name, own comment line.


# @dataclass turns the class below into a simple data container.
@dataclass
# Define CurrentUser: the verified identity every protected endpoint receives.
class CurrentUser:
    # id: the Supabase auth.users.id string, taken from the verified token only.
    id: str
    # email: the user's email from the token; empty string if Supabase sent none.
    email: str


# Define get_current_user: FastAPI dependency that resolves the caller or rejects with 401/500.
# authorization: the raw "Authorization" header value; Header(default=None) makes it optional
#   so WE can raise the friendly 401 instead of FastAPI raising its own 422 for a missing header.
# -> CurrentUser: on success the endpoint receives this object.
def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    # Check 1: header must exist and start with the "Bearer " scheme prefix.
    if not authorization or not authorization.startswith("Bearer "):
        # No usable header: abort with 401 so the frontend knows sign-in is required.
        raise HTTPException(
            # status_code 401: HTTP for "unauthenticated, please sign in".
            status_code=401,
            # detail: message the frontend can show or log.
            detail="Missing or malformed Authorization header (expected 'Bearer <token>').",
        )

    # Strip the "Bearer " prefix and surrounding whitespace to isolate the raw JWT.
    token = authorization.removeprefix("Bearer ").strip()
    # Check 2: the header could be exactly "Bearer " with nothing after it.
    if not token:
        # Empty token: same 401, more specific message for debugging.
        raise HTTPException(status_code=401, detail="Empty access token.")

    # Try to verify the token against Supabase.
    try:
        # Ask Supabase "is this token real, and whose is it?"; raises on bad/expired tokens.
        response = get_supabase().auth.get_user(token)
    # Catch AuthNotConfiguredError: .env has no Supabase URL/key, a server-side problem.
    except AuthNotConfiguredError as exc:
        # Comment: misconfiguration is OUR fault, not the client's, so answer 500, not 401.
        # Re-raise as HTTPException 500 carrying the original message; "from exc" chains tracebacks.
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    # Catch any other Exception: network failure, invalid token, expired token, malformed JWT.
    except Exception as exc:
        # Any verification failure means "we don't know who you are": answer 401, chain the cause.
        raise HTTPException(status_code=401, detail="Invalid or expired access token.") from exc

    # Pull the user object off Supabase's response with getattr (None-safe if the shape changes).
    user = getattr(response, "user", None)
    # Check 3: Supabase answered but attached no user, or a user with no id: still unauthenticated.
    if user is None or not getattr(user, "id", None):
        # Reject with 401 using the same message, so callers can't probe failure reasons.
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")

    # Success: build the CurrentUser from the verified token fields; str() guards non-string ids.
    # getattr(user, "email", "") with `or ""` guarantees email is always a string, never None.
    return CurrentUser(id=str(user.id), email=getattr(user, "email", "") or "")
