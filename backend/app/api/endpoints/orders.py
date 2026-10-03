"""Orders endpoints (BACKEND_PLAN.md sections 3 and 5).

These handlers stay thin: read the request, call business logic, return the
response. The rules live in app/business_logic/.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.business_logic import orders as order_logic
from app.business_logic.pricing import CartValidationError
from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.models.order import OrderCreatedOut, OrderIn, OrderItemOut, OrderOut
from app.schemas.orders import order_items as order_item_row
from app.schemas.orders import orders as order_row

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_created_out(order: order_row) -> OrderCreatedOut:
    return OrderCreatedOut(
        reference=order.reference,
        status=order.status,
        subtotal_kobo=order.subtotal_kobo,
        total_kobo=order.total_kobo,
        created_at=order.created_at,
    )


def _to_order_out(order: order_row, items: list[order_item_row]) -> OrderOut:
    return OrderOut(
        reference=order.reference,
        status=order.status,
        items=[OrderItemOut.model_validate(item) for item in items],
        subtotal_kobo=order.subtotal_kobo,
        delivery_fee_kobo=order.delivery_fee_kobo,
        total_kobo=order.total_kobo,
        created_at=order.created_at,
    )


@router.post("/", response_model=OrderCreatedOut)
def create_order(
    payload: OrderIn,
    response: Response,
    idempotency_key: str = Header(
        ..., alias="Idempotency-Key", description="Random ID for this attempt; stops duplicates"
    ),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Checkout. The user id comes from the verified token and every price
    from the database; the browser sends neither."""
    try:
        order, created = order_logic.create_order(db, user, payload, idempotency_key.strip())
    except CartValidationError as exc:
        raise HTTPException(status_code=400, detail={"errors": exc.problems}) from exc

    # 201 the first time; 200 when the idempotency key returns an existing order.
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return _to_created_out(order)


@router.get("/", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """The signed-in customer's orders, newest first."""
    return [_to_order_out(order, items) for order, items in order_logic.list_orders_for_user(db, user.id)]


@router.get("/{reference}", response_model=OrderOut)
def get_order(
    reference: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """One order. 404 for unknown references AND other people's orders alike,
    so nobody can probe which references exist."""
    found = order_logic.get_order_for_user(db, user.id, reference)
    if found is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    order, items = found
    return _to_order_out(order, items)
