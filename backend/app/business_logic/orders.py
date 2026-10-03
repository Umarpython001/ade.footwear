"""Order creation and lookup rules.

Because we talk to Postgres through SQLAlchemy we get a real transaction:
the order and its items are committed together, all or nothing. (The
`create_order()` SQL function in BACKEND_PLAN.md section 4 was only needed
because the Supabase client library cannot group writes into one transaction.)
"""

import secrets
import string

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.business_logic.pricing import validate_and_price_cart
from app.core.auth import CurrentUser
from app.models.order import OrderIn
from app.schemas.orders import order_items as order_item_row
from app.schemas.orders import orders as order_row

# Reference format from BACKEND_PLAN.md: "ADE-" + 6 letters/digits, e.g. ADE-7K3Q9P.
_REF_ALPHABET = string.ascii_uppercase + string.digits

# The owner has not set delivery fees yet (BACKEND_PLAN.md open question 7),
# so the fee is 0 and the total equals the subtotal.
DELIVERY_FEE_KOBO = 0


def _new_reference() -> str:
    return "ADE-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(6))


def _find_by_idempotency_key(db: Session, key: str):
    return db.query(order_row).filter(order_row.idempotency_key == key).first()


def create_order(
    db: Session, user: CurrentUser, payload: OrderIn, idempotency_key: str
) -> tuple[order_row, bool]:
    """Create an order and its items in one transaction.

    Returns (order, created). If the idempotency key was used before (a
    double-click or a retried request), returns the FIRST order again with
    created=False instead of making a duplicate.
    """
    existing = _find_by_idempotency_key(db, idempotency_key)
    if existing is not None:
        return existing, False

    # Raises CartValidationError on bad lines; the endpoint turns it into a 400.
    lines, subtotal = validate_and_price_cart(payload.items, db)

    order = order_row(
        reference=_new_reference(),
        user_id=user.id,
        idempotency_key=idempotency_key,
        customer_name=payload.customer.name,
        customer_email=payload.customer.email,
        phone=payload.customer.phone,
        address=payload.customer.address,
        city_state=payload.customer.city_state,
        note=payload.customer.note,
        status="submitted",
        subtotal_kobo=subtotal,
        delivery_fee_kobo=DELIVERY_FEE_KOBO,
        total_kobo=subtotal + DELIVERY_FEE_KOBO,
    )

    db.add(order)
    try:
        db.flush()  # assigns order.id and order.created_at defaults
        for line in lines:
            db.add(
                order_item_row(
                    order_id=order.id,
                    product_id=line.product_id,
                    product_name=line.product_name,  # snapshot, survives later renames
                    size=line.size,
                    quantity=line.quantity,
                    unit_price_kobo=line.unit_price_kobo,  # snapshot of the price charged
                    line_total_kobo=line.line_total_kobo,
                )
            )
        db.commit()
    except IntegrityError:
        db.rollback()
        # We lost a race: another request with the same idempotency key (or, very
        # rarely, the same reference) committed first. Return the existing order.
        existing = _find_by_idempotency_key(db, idempotency_key)
        if existing is not None:
            return existing, False
        raise

    db.refresh(order)

    # TODO (step 6): send the Mailgun confirmation email here. On success set
    # order.email_sent_at; a failed email must NOT undo the saved order.

    return order, True


def list_orders_for_user(db: Session, user_id: str) -> list[tuple[order_row, list[order_item_row]]]:
    """The signed-in customer's orders, newest first, each with its items."""
    orders = (
        db.query(order_row)
        .filter(order_row.user_id == user_id)
        .order_by(order_row.created_at.desc())
        .all()
    )
    return [(order, _items_of(db, order.id)) for order in orders]


def get_order_for_user(
    db: Session, user_id: str, reference: str
) -> tuple[order_row, list[order_item_row]] | None:
    """One order, only if it belongs to this customer. Returns None otherwise,
    so the endpoint can answer 404 and nobody can probe other people's orders."""
    order = (
        db.query(order_row)
        .filter(order_row.reference == reference, order_row.user_id == user_id)
        .first()
    )
    if order is None:
        return None
    return order, _items_of(db, order.id)


def _items_of(db: Session, order_id: str) -> list[order_item_row]:
    return db.query(order_item_row).filter(order_item_row.order_id == order_id).all()
