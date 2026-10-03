"""API models for the orders endpoints (BACKEND_PLAN.md sections 3 and 5).

Field names are snake_case in Python and camelCase on the wire, because that
is what JavaScript expects: `product_id` here is `productId` in the JSON.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class OrderItemIn(BaseModel):
    """One cart line: { productId, size, quantity }. Never any prices."""

    model_config = _CAMEL

    product_id: str = Field(min_length=1)
    size: str = Field(min_length=1)
    quantity: int = Field(ge=1)


class CustomerIn(BaseModel):
    model_config = _CAMEL

    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str = Field(min_length=7)
    address: str = Field(min_length=3)
    city_state: str = Field(min_length=2)
    note: str | None = None


class OrderIn(BaseModel):
    """POST /orders body. `confirmed` must be true: the customer ticked the
    "I have checked my order" box before sending."""

    model_config = _CAMEL

    items: list[OrderItemIn] = Field(min_length=1)
    customer: CustomerIn
    confirmed: Literal[True]


class OrderCreatedOut(BaseModel):
    """POST /orders reply (BACKEND_PLAN.md section 3, step 7)."""

    model_config = _CAMEL

    reference: str
    status: str
    subtotal_kobo: int
    total_kobo: int
    created_at: datetime


class OrderItemOut(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    product_id: str
    product_name: str
    size: str
    quantity: int
    unit_price_kobo: int
    line_total_kobo: int


class OrderOut(BaseModel):
    """One order with its items, for GET /orders and GET /orders/{reference}."""

    model_config = _CAMEL

    reference: str
    status: str
    items: list[OrderItemOut]
    subtotal_kobo: int
    delivery_fee_kobo: int
    total_kobo: int
    created_at: datetime
