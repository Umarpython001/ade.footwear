"""Order creation and lookup rules.

Because we talk to Postgres through SQLAlchemy we get a real transaction:
the order and its items are committed together, all or nothing. (The
`create_order()` SQL function in BACKEND_PLAN.md section 4 was only needed
because the Supabase client library cannot group writes into one transaction.)
"""

# Import secrets: cryptographically strong randomness for order references.
import secrets
# Import string: provides ascii_uppercase + digits used to build the reference alphabet.
import string

# Import IntegrityError: raised when the DB rejects a write (duplicate unique key, etc.).
from sqlalchemy.exc import IntegrityError
# Import Session: SQLAlchemy session type for the db argument in every function below.
from sqlalchemy.orm import Session

# Import validate_and_price_cart: cart checker from pricing.py; raises CartValidationError on bad lines.
from app.business_logic.pricing import validate_and_price_cart
# Import CurrentUser: the verified identity (id comes from the token, never the body).
from app.core.auth import CurrentUser
# Import OrderIn: the pydantic POST /orders body shape.
from app.models.order import OrderIn
# Import order_items DB model as order_item_row: the table each cart line becomes.
from app.schemas.orders import order_items as order_item_row
# Import orders DB model as order_row: the parent order table.
from app.schemas.orders import orders as order_row

# Comment: reference format from BACKEND_PLAN.md: "ADE-" + 6 letters/digits, e.g. ADE-7K3Q9P.
# _REF_ALPHABET: the 36 characters (A-Z, 0-9) each reference character is drawn from.
_REF_ALPHABET = string.ascii_uppercase + string.digits

# Comment: the owner has not set delivery fees yet (BACKEND_PLAN.md open question 7),
# Comment: so the fee is 0 and the total equals the subtotal.
# DELIVERY_FEE_KOBO: flat delivery fee in kobo applied to every order (0 for now).
DELIVERY_FEE_KOBO = 0


# Define _new_reference: mint one human-friendly order reference.
# -> str: e.g. "ADE-7K3Q9P". Leading underscore = private to this module.
def _new_reference() -> str:
    # "ADE-" prefix + 6 random draws from the alphabet via secrets.choice (secure randomness).
    return "ADE-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(6))


# Define _find_by_idempotency_key: look up an order by its idempotency key.
# db: the request's session. key: the Idempotency-Key header value.
# Returns the matching order row, or None when this key was never used.
def _find_by_idempotency_key(db: Session, key: str):
    # Query orders where idempotency_key equals key; .first() takes one row or None.
    return db.query(order_row).filter(order_row.idempotency_key == key).first()


# Define create_order: the single function that turns a checkout into saved rows.
# db: session. user: verified caller (user.id becomes orders.user_id).
# payload: validated OrderIn body. idempotency_key: the header value stopping duplicates.
# -> tuple[order_row, bool]: (the order, True if just created / False if it already existed).
def create_order(
    db: Session, user: CurrentUser, payload: OrderIn, idempotency_key: str
) -> tuple[order_row, bool]:
    # Docstring: contract -- idempotent creation; replays return the first order, never a copy.
    """Create an order and its items in one transaction.

    Returns (order, created). If the idempotency key was used before (a
    double-click or a retried request), returns the FIRST order again with
    created=False instead of making a duplicate.
    """
    # Idempotency check FIRST: if this key already made an order, return it without touching the cart.
    existing = _find_by_idempotency_key(db, idempotency_key)
    # existing is not None means "we've seen this attempt before".
    if existing is not None:
        # Return the original order with created=False (endpoint answers 200, not 201).
        return existing, False

    # Comment: raises CartValidationError on bad lines; the endpoint turns it into a 400.
    # Validate every cart line and compute the subtotal from DATABASE prices.
    lines, subtotal = validate_and_price_cart(payload.items, db)

    # Build the parent order row (not yet saved); user.id comes from the verified token.
    order = order_row(
        # reference: fresh human-friendly id, e.g. "ADE-7K3Q9P".
        reference=_new_reference(),
        # user_id: the verified caller's Supabase id -- never from the request body.
        user_id=user.id,
        # idempotency_key: stored unique so replays of this attempt hit the check above.
        idempotency_key=idempotency_key,
        # customer_name: snapshot of the delivery name from the form.
        customer_name=payload.customer.name,
        # customer_email: snapshot of the delivery email.
        customer_email=payload.customer.email,
        # phone: snapshot of the phone/WhatsApp number.
        phone=payload.customer.phone,
        # address: snapshot of the street address.
        address=payload.customer.address,
        # city_state: snapshot of "City, State".
        city_state=payload.customer.city_state,
        # note: optional delivery note (None when the customer left it blank).
        note=payload.customer.note,
        # status: every order starts life as "submitted".
        status="submitted",
        # subtotal_kobo: sum of the priced lines.
        subtotal_kobo=subtotal,
        # delivery_fee_kobo: flat fee (0 until the owner decides).
        delivery_fee_kobo=DELIVERY_FEE_KOBO,
        # total_kobo: what the customer owes: subtotal + fee.
        total_kobo=subtotal + DELIVERY_FEE_KOBO,
    )

    # Stage the order in the session (INSERT happens on flush/commit, not here).
    db.add(order)
    # Try the atomic write: order + all items commit together or not at all.
    try:
        # flush: send the INSERT for the order now so order.id/created_at defaults are assigned...
        # ...while staying inside the transaction (still rollback-able below).
        db.flush()  # assigns order.id and order.created_at defaults
        # Stage one order_items row per priced cart line, linked to the new order.id.
        for line in lines:
            # db.add stages each item row for the same transaction.
            db.add(
                # Build the item row from the priced line (names/prices are snapshots).
                order_item_row(
                    # order_id: foreign key to the parent order created above.
                    order_id=order.id,
                    # product_id: which product was ordered.
                    product_id=line.product_id,
                    # product_name: snapshot, survives later renames -- snapshot, survives later renames.
                    product_name=line.product_name,  # snapshot, survives later renames
                    # size: the size ordered.
                    size=line.size,
                    # quantity: how many pairs.
                    quantity=line.quantity,
                    # unit_price_kobo: snapshot of the price charged -- snapshot of the price charged.
                    unit_price_kobo=line.unit_price_kobo,  # snapshot of the price charged
                    # line_total_kobo: unit price x quantity.
                    line_total_kobo=line.line_total_kobo,
                )
            )
        # commit: persist order + items atomically; either all rows land or none do.
        db.commit()
    # except IntegrityError: a UNIQUE constraint fired (duplicate key committed by a racing request).
    except IntegrityError:
        # rollback: discard this attempt's staged writes so the DB is untouched by us.
        db.rollback()
        # Comment: we lost a race: another request with the same idempotency key (or, very
        # Comment: rarely, the same reference) committed first. Return the existing order.
        # Re-check: the winner's row is now visible, so return it as the idempotent answer.
        existing = _find_by_idempotency_key(db, idempotency_key)
        # If the winner is found, return it with created=False (a replay, not a new order).
        if existing is not None:
            return existing, False
        # No winner found (e.g. a reference collision): re-raise so it surfaces as a 500, not a silent lie.
        raise

    # refresh: reload the order's DB-assigned fields (id, created_at) into the Python object.
    db.refresh(order)

    # Comment: TODO (step 6): send the Mailgun confirmation email here. On success set
    # Comment: order.email_sent_at; a failed email must NOT undo the saved order.
    # (Mailgun was dropped from scope; this hook stays harmlessly, email_sent_at stays NULL.)

    # Return the saved order with created=True (endpoint answers 201 Created).
    return order, True


# Define list_orders_for_user: fetch one customer's orders, newest first, each with its items.
# db: session. user_id: the verified caller's id (ownership filter).
# -> list of (order, its items) tuples, newest order first.
def list_orders_for_user(db: Session, user_id: str) -> list[tuple[order_row, list[order_item_row]]]:
    # Docstring: one line stating the ordering + the per-order items.
    """The signed-in customer's orders, newest first, each with its items."""
    # Query orders filtered to this user, sorted newest-first, fetching all matches.
    orders = (
        # FROM orders WHERE user_id = <caller>.
        db.query(order_row)
        .filter(order_row.user_id == user_id)
        # ORDER BY created_at DESC = newest first, no extra sort step for the frontend.
        .order_by(order_row.created_at.desc())
        # .all(): execute and return every matching row as a list.
        .all()
    )
    # Pair each order with its items (one extra query per order via _items_of below).
    return [(order, _items_of(db, order.id)) for order in orders]


# Define get_order_for_user: fetch ONE order only if it belongs to this customer.
# db: session. user_id: verified caller. reference: the human-friendly id from the URL.
# -> (order, items) on success, or None when unknown OR owned by someone else.
def get_order_for_user(
    db: Session, user_id: str, reference: str
) -> tuple[order_row, list[order_item_row]] | None:
    # Docstring: explains the None contract and WHY (no probing other people's orders).
    """One order, only if it belongs to this customer. Returns None otherwise,
    so the endpoint can answer 404 and nobody can probe other people's orders."""
    # Query by BOTH reference and user_id: other people's orders simply don't match.
    order = (
        # FROM orders WHERE reference = <ref> AND user_id = <caller>.
        db.query(order_row)
        .filter(order_row.reference == reference, order_row.user_id == user_id)
        # .first(): one row or None.
        .first()
    )
    # No match: either the reference doesn't exist or it belongs to someone else (we don't say which).
    if order is None:
        # Return None so the endpoint answers 404 in both cases.
        return None
    # Match: return the order bundled with its items.
    return order, _items_of(db, order.id)


# Define _items_of: fetch all item rows belonging to one order. Private helper (leading underscore).
# db: session. order_id: the parent order's internal id.
# -> list of the order's item rows.
def _items_of(db: Session, order_id: str) -> list[order_item_row]:
    # FROM order_items WHERE order_id = <parent>; .all() returns every line (possibly []).
    return db.query(order_item_row).filter(order_item_row.order_id == order_id).all()
