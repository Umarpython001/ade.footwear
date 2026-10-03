"""Shared fixtures for the order tests.

Two dependency overrides keep tests fast and hermetic:

- get_db          -> a fresh in-memory SQLite database per test, so the suite
                     never touches the real Supabase data.
- get_current_user -> a fake signed-in user, so no token or network is needed
                     (see test_orders.py for how the 401 tests do the opposite).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_db
from app.main import app

USER_A = CurrentUser(id="user-a", email="a@example.com")


@pytest.fixture()
def db_session():
    # StaticPool makes every connection share the same in-memory database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def db_client(db_session):
    """TestClient wired to the test database, with NO sign-in override."""
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def client(db_client):
    """db_client, signed in as USER_A."""
    app.dependency_overrides[get_current_user] = lambda: USER_A
    return db_client
