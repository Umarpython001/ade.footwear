"""Shared fixtures for the order tests.

Two dependency overrides keep tests fast and hermetic:

- get_db          -> a fresh in-memory SQLite database per test, so the suite
                     never touches the real Supabase data.
- get_current_user -> a fake signed-in user, so no token or network is needed
                     (see test_orders.py for how the 401 tests do the opposite).
"""

# Import pytest: provides the @pytest.fixture decorator used below.
import pytest
# Import TestClient: runs the FastAPI app in-process so tests can GET/POST without a server.
from fastapi.testclient import TestClient
# Import create_engine: builds a SQLAlchemy engine; here pointed at in-memory SQLite.
from sqlalchemy import create_engine
# Import sessionmaker: factory for database sessions bound to the test engine.
from sqlalchemy.orm import sessionmaker
# Import StaticPool: makes every connection share ONE in-memory SQLite database...
# ...without it, each connection would get its own empty database and tables would "vanish".
from sqlalchemy.pool import StaticPool

# Import CurrentUser: the verified-identity type; USER_A below is a fake one for tests.
from app.core.auth import CurrentUser
# Import get_current_user: the real auth dependency we override with the fake user.
from app.core.auth import get_current_user
# Import Base: metadata holder whose create_all builds all tables in the test database.
from app.core.database import Base
# Import get_db: the real database dependency we override with the test SQLite session.
from app.core.database import get_db
# Import app: the FastAPI application under test (its dependency_overrides dict is the seam we use).
from app.main import app

# USER_A: the default fake signed-in user; the `client` fixture injects this as the caller.
USER_A = CurrentUser(id="user-a", email="a@example.com")


# @pytest.fixture(): marks db_session as a fixture; function-scoped = fresh DB per test.
@pytest.fixture()
# Define db_session: build an isolated in-memory database and yield one session on it.
def db_session():
    # Comment: StaticPool makes every connection share the same in-memory database.
    # Build an engine on "sqlite://" (pure RAM, no files) with thread sharing allowed...
    # ...and StaticPool so the whole test sees one consistent database.
    engine = create_engine(
        # "sqlite://": in-memory SQLite URL (nothing is written to disk).
        "sqlite://",
        # check_same_thread=False: allow the test client thread to reuse this connection.
        connect_args={"check_same_thread": False},
        # poolclass=StaticPool: single shared connection = single shared RAM database.
        poolclass=StaticPool,
    )
    # Create ALL tables (products, orders, order_items) inside the throwaway test database.
    Base.metadata.create_all(engine)
    # Build one session bound to the test engine.
    session = sessionmaker(bind=engine)()
    # try/finally: the test runs at `yield`; cleanup below runs even if the test fails.
    try:
        # Hand the session to the test; execution pauses here until the test finishes.
        yield session
    finally:
        # Close the session, releasing the SQLite connection.
        session.close()
        # Dispose the engine, destroying the in-memory database entirely.
        engine.dispose()


# @pytest.fixture(): db_client needs db_session, so pytest builds the DB first automatically.
@pytest.fixture()
# Define db_client: a TestClient whose database is the test SQLite session above.
# db_session: pytest injects the fixture by matching this argument name.
def db_client(db_session):
    # Docstring: clarifies this client has NO sign-in override (401 tests use it as-is).
    """TestClient wired to the test database, with NO sign-in override."""
    # Override get_db: whenever the app asks for a session, hand it our test session.
    # The lambda takes no arguments and returns the session (FastAPI calls it per request).
    app.dependency_overrides[get_db] = lambda: db_session
    # try/finally: the test runs at `yield`; the override is removed afterwards.
    try:
        # Build the in-process HTTP client around the app and hand it to the test.
        yield TestClient(app)
    finally:
        # Clear ALL overrides so no fake leaks into the next test.
        app.dependency_overrides.clear()


# @pytest.fixture(): client needs db_client, so pytest builds DB + client first.
@pytest.fixture()
# Define client: db_client PLUS a fake signed-in user (the common case).
# db_client: pytest injects the unauthenticated client built above.
def client(db_client):
    # Docstring: one line stating this client acts as USER_A.
    """db_client, signed in as USER_A."""
    # Override get_current_user: whenever the app asks "who is asking?", answer USER_A...
    # ...so no token is read and Supabase is never called.
    app.dependency_overrides[get_current_user] = lambda: USER_A
    # Hand the now-authenticated client to the test (db_client's cleanup still applies).
    return db_client
