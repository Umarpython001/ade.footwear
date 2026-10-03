"""Tests for the order rules that matter most (BACKEND_PLAN.md section 9).

Auth is faked with FastAPI's dependency_overrides: endpoints ask for the
`get_current_user` dependency, and the `client` fixture installs a lambda
returning a fake CurrentUser. The endpoint code cannot tell the difference,
but no token is read and Supabase is never called. The two 401 tests skip the
override so the REAL dependency runs and rejects the request itself.
"""

# Import SimpleNamespace: attribute-style holder (seeded.shoe) for the two fixture products.
from types import SimpleNamespace

# Import pytest: provides @pytest.fixture for the seeded catalogue below.
import pytest

# Import CurrentUser: used to build USER_B, the "other customer" for ownership tests.
from app.core.auth import CurrentUser
# Import get_current_user: the dependency key we re-override to swap USER_A -> USER_B mid-test.
from app.core.auth import get_current_user
# Import app: needed to reach app.dependency_overrides for the mid-test user swap.
from app.main import app
# Import orders DB model as order_row: used to count order rows in the idempotency test.
from app.schemas.orders import orders as order_row
# Import products DB model as product_row: used to build the seeded test catalogue.
from app.schemas.products import products as product_row

# USER_B: a second fake customer; tests swap to this user to prove ownership isolation.
USER_B = CurrentUser(id="user-b", email="b@example.com")

# HEADERS: default idempotency key sent with most test checkouts (overridden per-test where needed).
HEADERS = {"Idempotency-Key": "test-key-1"}


# @pytest.fixture(): builds a two-product catalogue in the test DB before each test using it.
@pytest.fixture()
# Define seeded: insert one orderable shoe + one hidden shoe; db_session comes from conftest.
def seeded(db_session):
    # shoe: active product, size 42 available / 43 sold out (drives the happy path + sold-out tests).
    shoe = product_row(
        # id: cart lines reference this id ("p-1").
        id="p-1",
        # slug: URL id (unused by order tests, required column).
        slug="test-shoe",
        # name: appears in validation messages and order snapshots.
        name="Test Shoe",
        # description: optional; None keeps the fixture minimal.
        description=None,
        # category: required column; value is irrelevant to order logic.
        category="Shoes",
        # price_kobo: 5,800,000 = N58,000; the price every totals assertion is computed from.
        price_kobo=5_800_000,
        # images: optional; None keeps the fixture minimal.
        images=None,
        # sizes: 42 orderable, 43 present-but-sold-out (drives the sold-out test).
        sizes=[{"size": "42", "available": True}, {"size": "43", "available": False}],
        # active: True = orderable (the happy-path product).
        active=True,
        # featured: irrelevant to orders; False keeps it out of homepage scenarios.
        featured=False,
    )
    # hidden: active=False product used to prove inactive products are rejected at checkout.
    hidden = product_row(
        # id: cart lines use "p-2" to target this product in the inactive test.
        id="p-2",
        # slug: required column.
        slug="hidden-shoe",
        # name: appears in the "not available" rejection message.
        name="Hidden Shoe",
        # description: optional; None.
        description=None,
        # category: required column.
        category="Shoes",
        # price_kobo: value never charged (checkout rejects this product first).
        price_kobo=1_000_000,
        # images: optional; None.
        images=None,
        # sizes: 42 available, but active=False blocks the order before sizes matter.
        sizes=[{"size": "42", "available": True}],
        # active: False = hidden, cannot be ordered.
        active=False,
        # featured: False.
        featured=False,
    )
    # Stage both rows in the test session.
    db_session.add_all([shoe, hidden])
    # Commit so the rows (and their defaults) are persisted for the test.
    db_session.commit()
    # Return both as attributes (seeded.shoe / seeded.hidden) for tests that mutate/inspect them.
    return SimpleNamespace(shoe=shoe, hidden=hidden)


# Define make_body: build a valid POST /orders body, with per-test overrides.
# product_id/size/quantity: the single cart line. **overrides: e.g. items=[], confirmed=False.
# -> dict: JSON-serializable body using the camelCase wire names (productId, cityState).
def make_body(product_id="p-1", size="42", quantity=2, **overrides):
    # body: the baseline valid checkout (2 x p-1 size 42 + full customer block + confirmed).
    body = {
        # items: one cart line; extra keys (like a forged unitPriceKobo) are ignored by the API.
        "items": [{"productId": product_id, "size": size, "quantity": quantity}],
        # customer: delivery details block matching CustomerIn.
        "customer": {
            # name: recipient name.
            "name": "Ada Obi",
            # email: recipient email.
            "email": "ada@example.com",
            # phone: phone/WhatsApp.
            "phone": "08012345678",
            # address: street address.
            "address": "12 Example Street",
            # cityState: camelCase wire name for city_state.
            "cityState": "Ikeja, Lagos",
            # note: optional; None = no note.
            "note": None,
        },
        # confirmed: the "I checked my order" box; must be true.
        "confirmed": True,
    }
    # Apply overrides: body.update replaces top-level keys (items=... or confirmed=...).
    body.update(overrides)
    # Return the finished body dict.
    return body


# Comment: pricing section header -- proves the browser can never set prices.
# --- pricing ---------------------------------------------------------------


# Test: even a forged price in the body is ignored; the DB price is charged.
# client: signed-in (USER_A) test client. seeded: the two-product catalogue.
def test_price_charged_is_the_database_price(client, seeded):
    # Comment: the browser even sends a (fake) price; it must be ignored.
    # Build the valid body first.
    body = make_body()
    # Sneak a forged price into the line (OrderItemIn has no such field; pydantic ignores extras).
    body["items"][0]["unitPriceKobo"] = 1

    # POST the checkout with the forged price.
    response = client.post("/orders/", json=body, headers=HEADERS)

    # 201: the order was created.
    assert response.status_code == 201
    # totalKobo = DB price x quantity (5,800,000 x 2), NOT the forged 1 kobo.
    assert response.json()["totalKobo"] == 5_800_000 * 2
    # subtotalKobo matches for the same reason.
    assert response.json()["subtotalKobo"] == 5_800_000 * 2


# Test: with no delivery fee configured, total always equals subtotal.
def test_total_equals_subtotal_while_delivery_fee_is_zero(client, seeded):
    # POST one pair (quantity=1 overrides the default 2).
    response = client.post("/orders/", json=make_body(quantity=1), headers=HEADERS)

    # 201: created.
    assert response.status_code == 201
    # total equals subtotal while DELIVERY_FEE_KOBO is 0.
    assert response.json()["totalKobo"] == response.json()["subtotalKobo"]


# Comment: cart validation section header -- every rejection path for bad lines.
# --- cart validation --------------------------------------------------------


# Test: an unknown product id is rejected with 400.
def test_unknown_product_rejected(client, seeded):
    # POST a line for product "nope", which is not in the catalogue.
    response = client.post("/orders/", json=make_body(product_id="nope"), headers=HEADERS)

    # 400: validation failure (not 422 -- the SHAPE was fine, the VALUE was bad).
    assert response.status_code == 400
    # The per-line message names the problem for the frontend to display.
    assert "Unknown product" in str(response.json()["detail"])


# Test: an inactive (hidden) product is rejected with 400.
def test_inactive_product_rejected(client, seeded):
    # POST a line for "p-2", the active=False fixture product.
    response = client.post("/orders/", json=make_body(product_id="p-2"), headers=HEADERS)

    # 400: hidden products can never be ordered.
    assert response.status_code == 400
    # Message check proves it was the inactive rule, not another rule.
    assert "not available" in str(response.json()["detail"])


# Test: a sold-out size is rejected with 400.
def test_sold_out_size_rejected(client, seeded):
    # POST size "43", which exists on p-1 but has available=False.
    response = client.post("/orders/", json=make_body(size="43"), headers=HEADERS)

    # 400: the size rule fired.
    assert response.status_code == 400
    # Message check proves it was the sold-out rule.
    assert "sold out" in str(response.json()["detail"])


# Test: a size the product doesn't come in is rejected with 400.
def test_unknown_size_rejected(client, seeded):
    # POST size "99", which no fixture product offers.
    response = client.post("/orders/", json=make_body(size="99"), headers=HEADERS)

    # 400: the unknown-size rule fired.
    assert response.status_code == 400
    # Message check proves it was the unknown-size rule.
    assert "does not come in size" in str(response.json()["detail"])


# Test: quantity 0 is rejected at the SHAPE level with 422 (Field(ge=1) on OrderItemIn).
def test_quantity_below_one_rejected(client, seeded):
    # POST quantity=0; pydantic rejects before business logic ever runs.
    response = client.post("/orders/", json=make_body(quantity=0), headers=HEADERS)

    # 422: malformed data (FastAPI's automatic validation error).
    assert response.status_code == 422


# Test: an empty cart is rejected with 422 (Field(min_length=1) on OrderIn.items).
def test_empty_items_rejected(client, seeded):
    # POST items=[] via the overrides mechanism.
    response = client.post("/orders/", json=make_body(items=[]), headers=HEADERS)

    # 422: an order needs at least one line.
    assert response.status_code == 422


# Test: confirmed=false is rejected with 422 (Literal[True] only accepts true).
def test_unconfirmed_order_rejected(client, seeded):
    # POST with the confirmation box unticked.
    response = client.post("/orders/", json=make_body(confirmed=False), headers=HEADERS)

    # 422: the customer must confirm their details.
    assert response.status_code == 422


# Test: a missing Idempotency-Key header is rejected with 422 (Header(...) is required).
def test_missing_idempotency_key_rejected(client, seeded):
    # POST with NO headers at all.
    response = client.post("/orders/", json=make_body())

    # 422: the key is mandatory, so duplicates are always detectable.
    assert response.status_code == 422


# Comment: auth section header -- both tests use db_client (NO fake user) so the REAL dependency runs.
# --- auth -------------------------------------------------------------------


# Test: no Authorization header at all gets a 401.
# db_client: test client WITHOUT the sign-in override, so get_current_user really executes.
def test_missing_token_gets_401(db_client, seeded):
    # Comment: db_client has NO override, so the real get_current_user runs and rejects
    # Comment: the request before Supabase is ever called.
    # POST with no Authorization header.
    response = db_client.post("/orders/", json=make_body(), headers=HEADERS)

    # 401: missing credentials.
    assert response.status_code == 401


# Test: a garbage token also gets a 401 (never a crash, never a pass).
# monkeypatch: pytest helper that temporarily replaces an object for one test.
def test_fake_token_gets_401(db_client, seeded, monkeypatch):
    # Comment: the real dependency runs; make token verification itself blow up to
    # Comment: prove any failure becomes a 401, never a crash or a passed check.
    # Define boom: stands in for get_supabase and always raises, simulating Supabase rejecting the token.
    def boom():
        raise RuntimeError("verification failed")

    # Replace app.core.auth.get_supabase with boom for the duration of this test only.
    monkeypatch.setattr("app.core.auth.get_supabase", boom)

    # POST with a garbage Bearer token; the real dependency calls boom() and gets an exception.
    response = db_client.post(
        # Path: the checkout endpoint.
        "/orders/",
        # Body: valid checkout (auth fails before the body matters).
        json=make_body(),
        # Headers: idempotency key PLUS the fake token (**HEADERS unpacks the dict, then we add Authorization).
        headers={**HEADERS, "Authorization": "Bearer garbage"},
    )

    # 401: the endpoint converts ANY verification failure into 401.
    assert response.status_code == 401


# Comment: ownership section header -- proves customers are isolated from each other.
# --- ownership ----------------------------------------------------------------


# Test: USER_B gets 404 for USER_A's order AND an empty list (never a leak, never a 403 hint).
def test_customer_cannot_see_other_customers_order(client, seeded):
    # Create an order as USER_A and capture its reference.
    reference = client.post("/orders/", json=make_body(), headers=HEADERS).json()["reference"]

    # Comment: swap who FastAPI thinks is asking: same endpoints, different "user".
    # Re-point the get_current_user override at USER_B mid-test (same app, same client).
    app.dependency_overrides[get_current_user] = lambda: USER_B

    # USER_B asking for USER_A's reference: 404, indistinguishable from "doesn't exist".
    assert client.get(f"/orders/{reference}").status_code == 404
    # USER_B's own history: empty list (USER_A's order is invisible to them).
    assert client.get("/orders/").json() == []


# Comment: idempotency section header -- double-clicks and retries never duplicate.
# --- idempotency --------------------------------------------------------------


# Test: the same Idempotency-Key twice creates exactly ONE order row.
# db_session: lets the test count order rows directly in the test database.
def test_same_idempotency_key_creates_one_order(client, seeded, db_session):
    # First attempt: creates the order (201).
    first = client.post("/orders/", json=make_body(), headers=HEADERS)
    # Second attempt, SAME key: replays instead of duplicating (200).
    second = client.post("/orders/", json=make_body(), headers=HEADERS)

    # First call created (201 Created).
    assert first.status_code == 201
    # Second call replayed (200 OK, not 201).
    assert second.status_code == 200
    # Both calls return the SAME reference (the first order, not a copy).
    assert second.json()["reference"] == first.json()["reference"]
    # The database holds exactly one order row for all of it.
    assert db_session.query(order_row).count() == 1


# Comment: snapshots section header -- saved orders are frozen in time.
# --- snapshots ------------------------------------------------------------------


# Test: changing the product price later does NOT rewrite a saved order.
def test_order_keeps_the_price_charged_after_a_price_change(client, seeded, db_session):
    # Create an order for 1 pair at 5,800,000 kobo; capture its reference.
    reference = client.post("/orders/", json=make_body(quantity=1), headers=HEADERS).json()["reference"]

    # Comment: the owner later doubles the price; the saved order must not change.
    # Mutate the live product row to 11,600,000 kobo AFTER the order was saved.
    seeded.shoe.price_kobo = 11_600_000
    # Commit the price change to the test database.
    db_session.commit()

    # Re-fetch the saved order through the API.
    order = client.get(f"/orders/{reference}").json()
    # The snapshot still shows the price actually charged (5,800,000), not the new one.
    assert order["items"][0]["unitPriceKobo"] == 5_800_000
    # The order total is likewise frozen at the charged amount.
    assert order["totalKobo"] == 5_800_000
