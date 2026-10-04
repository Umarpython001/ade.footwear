"""Server-cart rules: one cart per signed-in customer.

The cart is stored as plain rows (no prices -- totals always come from the
products table at display/checkout time). Writes are full-replace: the
frontend sends its whole cart and we swap it in atomically, which makes
retries and cross-device sync trivially idempotent.
"""

# Import Session: SQLAlchemy session type for the db argument in every function below.
from sqlalchemy.orm import Session

# Import CartItemIn: the pydantic cart-line shape ({productId, size, quantity}).
from app.models.cart import CartItemIn
# Import cart_items DB model as cart_item_row: the table each cart line becomes.
from app.schemas.cart import cart_items as cart_item_row

# MAX_QUANTITY: per-line cap; duplicate lines in one payload are summed, then capped here.
MAX_QUANTITY = 99


# Define get_cart: fetch one customer's cart lines, oldest first.
# db: session. user_id: the verified caller's id (ownership filter).
# -> the customer's cart-item rows, oldest first.
def get_cart(db: Session, user_id: str) -> list[cart_item_row]:
    # FROM cart_items WHERE user_id = <caller> ORDER BY created_at ASC.
    return (
        db.query(cart_item_row)
        .filter(cart_item_row.user_id == user_id)
        .order_by(cart_item_row.created_at.asc())
        .all()
    )


# Define replace_cart: swap the customer's whole cart for the given lines, atomically.
# db: session. user_id: verified caller. items: the full new cart (possibly empty = clear).
# -> the saved cart-item rows, oldest first.
def replace_cart(db: Session, user_id: str, items: list[CartItemIn]) -> list[cart_item_row]:
    # Dedupe the payload first: sum quantities of repeated (product, size) lines, cap at 99.
    # merged: maps (product_id, size) -> total quantity; order: first-seen key order.
    merged: dict[tuple[str, str], int] = {}
    order: list[tuple[str, str]] = []
    for item in items:
        # Key on (product, size): the same granularity as the UNIQUE constraint below.
        key = (item.product_id, item.size)
        if key in merged:
            # Repeat line: add to the running total (capped at MAX_QUANTITY).
            merged[key] = min(merged[key] + item.quantity, MAX_QUANTITY)
        else:
            # First sighting: record the quantity and remember the position.
            merged[key] = min(item.quantity, MAX_QUANTITY)
            order.append(key)

    # Delete the customer's existing lines in one statement (no per-row round trips).
    db.query(cart_item_row).filter(cart_item_row.user_id == user_id).delete(synchronize_session=False)
    # Stage one row per merged line, in first-seen order.
    for product_id, size in order:
        db.add(
            cart_item_row(
                # user_id: the verified caller -- never from the request body.
                user_id=user_id,
                # product_id/size/quantity: the merged line values.
                product_id=product_id,
                size=size,
                quantity=merged[(product_id, size)],
            )
        )
    # commit: the delete + inserts land together, so readers never see a half-written cart.
    db.commit()
    # Re-read and return the saved rows (fresh timestamps, oldest first).
    return get_cart(db, user_id)


# Define clear_cart: remove every line of the customer's cart.
# db: session. user_id: verified caller.
def clear_cart(db: Session, user_id: str) -> None:
    # FROM cart_items WHERE user_id = <caller>: delete all of their lines, nothing else.
    db.query(cart_item_row).filter(cart_item_row.user_id == user_id).delete(synchronize_session=False)
    # commit: persist the deletion.
    db.commit()
