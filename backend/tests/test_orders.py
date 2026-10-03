"""Tests for the order rules that matter most (BACKEND_PLAN.md section 9).

Auth is faked with FastAPI's dependency_overrides: endpoints ask for the
`get_current_user` dependency, and the `client` fixture installs a lambda
returning a fake CurrentUser. The endpoint code cannot tell the difference,
but no token is read and Supabase is never called. The two 401 tests skip the
override so the REAL dependency runs and rejects the request itself.
"""

from types import SimpleNamespace

import pytest

from app.core.auth import CurrentUser, get_current_user
from app.main import app
from app.schemas.orders import orders as order_row
from app.schemas.products import products as product_row

USER_B = CurrentUser(id="user-b", email="b@example.com")

HEADERS = {"Idempotency-Key": "test-key-1"}


@pytest.fixture()
def seeded(db_session):
    shoe = product_row(
        id="p-1",
        slug="test-shoe",
        name="Test Shoe",
        description=None,
        category="Shoes",
        price_kobo=5_800_000,
        images=None,
        sizes=[{"size": "42", "available": True}, {"size": "43", "available": False}],
        active=True,
        featured=False,
    )
    hidden = product_row(
        id="p-2",
        slug="hidden-shoe",
        name="Hidden Shoe",
        description=None,
        category="Shoes",
        price_kobo=1_000_000,
        images=None,
        sizes=[{"size": "42", "available": True}],
        active=False,
        featured=False,
    )
    db_session.add_all([shoe, hidden])
    db_session.commit()
    return SimpleNamespace(shoe=shoe, hidden=hidden)


def make_body(product_id="p-1", size="42", quantity=2, **overrides):
    body = {
        "items": [{"productId": product_id, "size": size, "quantity": quantity}],
        "customer": {
            "name": "Ada Obi",
            "email": "ada@example.com",
            "phone": "08012345678",
            "address": "12 Example Street",
            "cityState": "Ikeja, Lagos",
            "note": None,
        },
        "confirmed": True,
    }
    body.update(overrides)
    return body


# --- pricing ---------------------------------------------------------------


def test_price_charged_is_the_database_price(client, seeded):
    # The browser even sends a (fake) price; it must be ignored.
    body = make_body()
    body["items"][0]["unitPriceKobo"] = 1

    response = client.post("/orders/", json=body, headers=HEADERS)

    assert response.status_code == 201
    assert response.json()["totalKobo"] == 5_800_000 * 2
    assert response.json()["subtotalKobo"] == 5_800_000 * 2


def test_total_equals_subtotal_while_delivery_fee_is_zero(client, seeded):
    response = client.post("/orders/", json=make_body(quantity=1), headers=HEADERS)

    assert response.status_code == 201
    assert response.json()["totalKobo"] == response.json()["subtotalKobo"]


# --- cart validation --------------------------------------------------------


def test_unknown_product_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(product_id="nope"), headers=HEADERS)

    assert response.status_code == 400
    assert "Unknown product" in str(response.json()["detail"])


def test_inactive_product_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(product_id="p-2"), headers=HEADERS)

    assert response.status_code == 400
    assert "not available" in str(response.json()["detail"])


def test_sold_out_size_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(size="43"), headers=HEADERS)

    assert response.status_code == 400
    assert "sold out" in str(response.json()["detail"])


def test_unknown_size_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(size="99"), headers=HEADERS)

    assert response.status_code == 400
    assert "does not come in size" in str(response.json()["detail"])


def test_quantity_below_one_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(quantity=0), headers=HEADERS)

    assert response.status_code == 422


def test_empty_items_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(items=[]), headers=HEADERS)

    assert response.status_code == 422


def test_unconfirmed_order_rejected(client, seeded):
    response = client.post("/orders/", json=make_body(confirmed=False), headers=HEADERS)

    assert response.status_code == 422


def test_missing_idempotency_key_rejected(client, seeded):
    response = client.post("/orders/", json=make_body())

    assert response.status_code == 422


# --- auth -------------------------------------------------------------------


def test_missing_token_gets_401(db_client, seeded):
    # db_client has NO override, so the real get_current_user runs and rejects
    # the request before Supabase is ever called.
    response = db_client.post("/orders/", json=make_body(), headers=HEADERS)

    assert response.status_code == 401


def test_fake_token_gets_401(db_client, seeded, monkeypatch):
    # The real dependency runs; make token verification itself blow up to
    # prove any failure becomes a 401, never a crash or a passed check.
    def boom():
        raise RuntimeError("verification failed")

    monkeypatch.setattr("app.core.auth.get_supabase", boom)

    response = db_client.post(
        "/orders/",
        json=make_body(),
        headers={**HEADERS, "Authorization": "Bearer garbage"},
    )

    assert response.status_code == 401


# --- ownership ----------------------------------------------------------------


def test_customer_cannot_see_other_customers_order(client, seeded):
    reference = client.post("/orders/", json=make_body(), headers=HEADERS).json()["reference"]

    # Swap who FastAPI thinks is asking: same endpoints, different "user".
    app.dependency_overrides[get_current_user] = lambda: USER_B

    assert client.get(f"/orders/{reference}").status_code == 404
    assert client.get("/orders/").json() == []


# --- idempotency --------------------------------------------------------------


def test_same_idempotency_key_creates_one_order(client, seeded, db_session):
    first = client.post("/orders/", json=make_body(), headers=HEADERS)
    second = client.post("/orders/", json=make_body(), headers=HEADERS)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["reference"] == first.json()["reference"]
    assert db_session.query(order_row).count() == 1


# --- snapshots ------------------------------------------------------------------


def test_order_keeps_the_price_charged_after_a_price_change(client, seeded, db_session):
    reference = client.post("/orders/", json=make_body(quantity=1), headers=HEADERS).json()["reference"]

    # The owner later doubles the price; the saved order must not change.
    seeded.shoe.price_kobo = 11_600_000
    db_session.commit()

    order = client.get(f"/orders/{reference}").json()
    assert order["items"][0]["unitPriceKobo"] == 5_800_000
    assert order["totalKobo"] == 5_800_000
