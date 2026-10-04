"""Tests for the server cart (GET /cart, PUT /cart, DELETE /cart).

Auth is faked with FastAPI's dependency_overrides, the same seam as the order
tests: the `client` fixture (conftest.py) signs requests in as USER_A, and
ownership tests re-point the override at USER_B mid-test. The two 401 tests
use `db_client` (no override) so the REAL dependency runs.
"""

# Import CurrentUser: used to build USER_B, the "other customer" for ownership tests.
from app.core.auth import CurrentUser
# Import get_current_user: the dependency key we re-override to swap USER_A -> USER_B mid-test.
from app.core.auth import get_current_user
# Import app: needed to reach app.dependency_overrides for the mid-test user swap.
from app.main import app


# USER_B: a second fake customer; tests swap to this user to prove cart isolation.
USER_B = CurrentUser(id="user-b", email="b@example.com")


# Define cart_body: build a valid PUT /cart body from (product_id, size, quantity) tuples.
# lines: e.g. [("p-1", "42", 2)]. -> dict: JSON body using camelCase wire names.
def cart_body(*lines):
    # Build one {productId, size, quantity} dict per tuple.
    return {
        "items": [{"productId": pid, "size": size, "quantity": qty} for pid, size, qty in lines]
    }


# Test: a fresh customer reads an empty cart.
# client: signed-in (USER_A) test client.
def test_get_empty_cart_for_new_customer(client):
    # GET the cart with nothing saved yet.
    response = client.get("/cart/")

    # 200 with an empty items list.
    assert response.status_code == 200
    assert response.json() == {"items": []}


# Test: PUT then GET round-trips the lines.
def test_put_then_get_roundtrip(client):
    # Save two lines.
    put = client.put("/cart/", json=cart_body(("p-1", "42", 2), ("p-2", "40", 1)))

    # 200 and the reply already carries the saved cart.
    assert put.status_code == 200
    assert put.json() == {
        "items": [
            {"productId": "p-1", "size": "42", "quantity": 2},
            {"productId": "p-2", "size": "40", "quantity": 1},
        ]
    }

    # A fresh GET returns the same cart.
    assert client.get("/cart/").json() == put.json()


# Test: PUT replaces the whole cart (no merge with previous lines).
def test_put_replaces_previous_cart(client):
    # Save an initial cart.
    client.put("/cart/", json=cart_body(("p-1", "42", 2)))

    # Replace with a different cart.
    replaced = client.put("/cart/", json=cart_body(("p-9", "44", 1)))

    # Only the new lines survive.
    assert replaced.json() == {"items": [{"productId": "p-9", "size": "44", "quantity": 1}]}
    assert client.get("/cart/").json() == replaced.json()


# Test: an empty PUT clears the cart.
def test_put_empty_clears_cart(client):
    # Save something, then replace with nothing.
    client.put("/cart/", json=cart_body(("p-1", "42", 2)))
    cleared = client.put("/cart/", json={"items": []})

    # Empty cart back.
    assert cleared.json() == {"items": []}
    assert client.get("/cart/").json() == {"items": []}


# Test: duplicate (product, size) lines in one payload are summed, not doubled.
def test_duplicate_lines_are_summed(client):
    # Same line twice in one body: 2 + 3 = 5.
    response = client.put("/cart/", json=cart_body(("p-1", "42", 2), ("p-1", "42", 3)))

    # One merged line with quantity 5.
    assert response.json() == {"items": [{"productId": "p-1", "size": "42", "quantity": 5}]}


# Test: DELETE empties the cart.
def test_delete_clears_cart(client):
    # Save something, then delete.
    client.put("/cart/", json=cart_body(("p-1", "42", 2)))
    deleted = client.delete("/cart/")

    # 200 with the empty cart shape.
    assert deleted.status_code == 200
    assert deleted.json() == {"items": []}
    assert client.get("/cart/").json() == {"items": []}


# Test: quantity 0 is rejected at the SHAPE level with 422 (Field(ge=1) on CartItemIn).
def test_quantity_below_one_rejected(client):
    # PUT quantity=0; pydantic rejects before business logic ever runs.
    response = client.put("/cart/", json=cart_body(("p-1", "42", 0)))

    # 422: malformed data (FastAPI's automatic validation error).
    assert response.status_code == 422


# Test: USER_B cannot see USER_A's cart (per-user isolation, never a leak).
def test_customers_cannot_see_each_others_carts(client):
    # Save a cart as USER_A.
    client.put("/cart/", json=cart_body(("p-1", "42", 2)))

    # Comment: swap who FastAPI thinks is asking: same endpoints, different "user".
    # Re-point the get_current_user override at USER_B mid-test (same app, same client).
    app.dependency_overrides[get_current_user] = lambda: USER_B

    # USER_B reads an empty cart (USER_A's lines are invisible to them).
    assert client.get("/cart/").json() == {"items": []}


# Test: no Authorization header at all gets a 401.
# db_client: test client WITHOUT the sign-in override, so get_current_user really executes.
def test_missing_token_gets_401(db_client):
    # GET with no Authorization header.
    assert db_client.get("/cart/").status_code == 401
    # PUT with no Authorization header.
    assert db_client.put("/cart/", json=cart_body(("p-1", "42", 1))).status_code == 401
    # DELETE with no Authorization header.
    assert db_client.delete("/cart/").status_code == 401
