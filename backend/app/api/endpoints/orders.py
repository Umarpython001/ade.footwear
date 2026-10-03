"""Orders endpoints (BACKEND_PLAN.md sections 3 and 5).

These handlers stay thin: read the request, call business logic, return the
response. The rules live in app/business_logic/.
"""

# Import APIRouter: groups these three routes under the "/orders" prefix with the "orders" tag.
from fastapi import APIRouter  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import Depends: declares injectable needs (database session, verified user) in each handler's signature.
from fastapi import Depends  # noqa: E402 -- same package, second name, own comment.
# Import Header: reads the Idempotency-Key HTTP header into an argument.
from fastapi import Header  # noqa: E402 -- same package, third name, own comment.
# Import HTTPException: aborts a request with a status code + message (400/401/404 below).
from fastapi import HTTPException  # noqa: E402 -- same package, fourth name, own comment.
# Import Response: lets create_order set 201 vs 200 on the outgoing response.
from fastapi import Response  # noqa: E402 -- same package, fifth name, own comment.
# Import status: named HTTP codes (status.HTTP_201_CREATED reads better than 201).
from fastapi import status  # noqa: E402 -- same package, sixth name, own comment.
# Import Session: SQLAlchemy session type for the db argument.
from sqlalchemy.orm import Session

# Import the business-logic module as order_logic: create/list/get rules (transaction, idempotency, ownership).
from app.business_logic import orders as order_logic
# Import CartValidationError: raised by pricing; caught below and turned into a 400.
from app.business_logic.pricing import CartValidationError
# Import CurrentUser: the verified identity type (id from the token, never the body).
from app.core.auth import CurrentUser
# Import get_current_user: the dependency that verifies the Bearer token or raises 401.
from app.core.auth import get_current_user
# Import get_db: dependency that yields one request-scoped database session.
from app.core.database import get_db
# Import OrderCreatedOut: response shape for POST /orders (reference, status, totals, created_at).
from app.models.order import OrderCreatedOut
# Import OrderIn: validated POST /orders body shape (items + customer + confirmed).
from app.models.order import OrderIn
# Import OrderItemOut: one order line in API responses.
from app.models.order import OrderItemOut
# Import OrderOut: full order-with-items response shape for the two GET endpoints.
from app.models.order import OrderOut
# Import order_items DB model as order_item_row: row type for the _to_order_out items argument.
from app.schemas.orders import order_items as order_item_row
# Import orders DB model as order_row: row type for the converter functions' order argument.
from app.schemas.orders import orders as order_row

# Create the router: every route below is served under /orders and grouped as "orders" in /docs.
router = APIRouter(prefix="/orders", tags=["orders"])


# Define _to_created_out: convert a saved order ROW into the POST reply SHAPE.
# order: the freshly created (or replayed) order row. -> OrderCreatedOut: the 201/200 body.
def _to_created_out(order: order_row) -> OrderCreatedOut:
    # Build the reply, copying each field from the row; internal columns (id, key, user_id) stay hidden.
    return OrderCreatedOut(
        # reference: human-friendly id the customer sees (e.g. "ADE-7K3Q9P").
        reference=order.reference,
        # status: lifecycle state ("submitted").
        status=order.status,
        # subtotal_kobo: sum of lines in kobo.
        subtotal_kobo=order.subtotal_kobo,
        # total_kobo: subtotal + delivery fee.
        total_kobo=order.total_kobo,
        # created_at: when the row was created.
        created_at=order.created_at,
    )


# Define _to_order_out: convert an order ROW + its item ROWS into the full GET response SHAPE.
# order: the order row. items: its item rows. -> OrderOut: reference, status, items, money, created_at.
def _to_order_out(order: order_row, items: list[order_item_row]) -> OrderOut:
    # Build the response; each item row is validated into an OrderItemOut via from_attributes.
    return OrderOut(
        # reference: human-friendly id.
        reference=order.reference,
        # status: lifecycle state.
        status=order.status,
        # items: convert every DB row into its API shape with model_validate (reads row attributes).
        items=[OrderItemOut.model_validate(item) for item in items],
        # subtotal_kobo: sum of lines.
        subtotal_kobo=order.subtotal_kobo,
        # delivery_fee_kobo: flat fee (0 until the owner decides).
        delivery_fee_kobo=order.delivery_fee_kobo,
        # total_kobo: subtotal + fee.
        total_kobo=order.total_kobo,
        # created_at: when the order was created.
        created_at=order.created_at,
    )


# @router.post("/"): handle POST /orders (checkout); reply shape fixed as OrderCreatedOut.
@router.post("/", response_model=OrderCreatedOut)
# Define create_order: the checkout handler. FastAPI fills every argument below.
# payload: JSON body validated as OrderIn (422 on bad shape). response: lets us set 201 vs 200.
# idempotency_key: REQUIRED header (alias "Idempotency-Key"); "..." means missing key = 422.
# db: request session via get_db. user: verified caller via get_current_user (401 when bad/missing).
def create_order(
    payload: OrderIn,
    response: Response,
    idempotency_key: str = Header(
        # ... = required: FastAPI rejects the request when the header is absent.
        ...,
        # alias: the real HTTP header name (Python names can't contain hyphens).
        alias="Idempotency-Key",
        # description: shown in /docs so frontend devs know to send a random UUID per attempt.
        description="Random ID for this attempt; stops duplicates",
    ),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: states the two security guarantees of this endpoint.
    """Checkout. The user id comes from the verified token and every price
    from the database; the browser sends neither."""
    # Try the business-logic creation (validates cart, prices from DB, saves atomically).
    try:
        # .strip() removes accidental whitespace around the pasted key.
        order, created = order_logic.create_order(db, user, payload, idempotency_key.strip())
    # except CartValidationError: unknown/inactive product or bad/sold-out size.
    except CartValidationError as exc:
        # Turn it into a 400 carrying every per-line message; "from exc" chains the traceback.
        raise HTTPException(status_code=400, detail={"errors": exc.problems}) from exc

    # Comment: 201 the first time; 200 when the idempotency key returns an existing order.
    # created=True -> 201 Created; created=False (replay) -> 200 OK with the same order.
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    # Convert the row to the reply shape and return it.
    return _to_created_out(order)


# @router.get("/"): handle GET /orders (order history); reply is a list of OrderOut.
@router.get("/", response_model=list[OrderOut])
# Define list_orders: the history handler; only signed-in callers reach here (401 otherwise).
# db: request session. user: verified caller whose id filters the rows.
def list_orders(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: states the ordering guarantee.
    """The signed-in customer's orders, newest first."""
    # Fetch (order, items) pairs for this user and convert each pair to its API shape.
    return [_to_order_out(order, items) for order, items in order_logic.list_orders_for_user(db, user.id)]


# @router.get("/{reference}"): handle GET /orders/<ref>; reply is one OrderOut.
@router.get("/{reference}", response_model=OrderOut)
# Define get_order: the single-order handler.
# reference: the {reference} path segment (e.g. "ADE-7K3Q9P"). db/user: same injections as above.
def get_order(
    reference: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: explains the deliberate 404-for-both-cases behaviour (anti-probing).
    """One order. 404 for unknown references AND other people's orders alike,
    so nobody can probe which references exist."""
    # Look up the order constrained to this user; None = unknown ref OR someone else's.
    found = order_logic.get_order_for_user(db, user.id, reference)
    # No match: answer 404 without revealing which of the two cases it was.
    if found is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    # Match: unpack the (order, items) pair...
    order, items = found
    # ...convert to the API shape and return it.
    return _to_order_out(order, items)
