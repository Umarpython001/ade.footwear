"""API models for the orders endpoints (BACKEND_PLAN.md sections 3 and 5).

Field names are snake_case in Python and camelCase on the wire, because that
is what JavaScript expects: `product_id` here is `productId` in the JSON.
"""

# Import datetime: type of created_at timestamps in responses.
from datetime import datetime
# Import Literal: constrains a field to exact values; Literal[True] means "must be true".
from typing import Literal

# Import BaseModel: pydantic base class; validates input and serializes output.
from pydantic import BaseModel  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import ConfigDict: per-model settings (here: camelCase conversion on the wire).
from pydantic import ConfigDict  # noqa: E402 -- same package, second name, own comment.
# Import Field: adds validation rules (min length, minimum value) to a field.
from pydantic import Field  # noqa: E402 -- same package, third name, own comment.
# Import to_camel: converts snake_case names to camelCase for JSON (product_id -> productId).
from pydantic.alias_generators import to_camel

# _CAMEL: shared config; every model using it accepts snake_case in Python and emits camelCase JSON.
# populate_by_name=True lets tests/builders use either naming style when constructing objects.
_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# Define OrderItemIn: one cart line as the browser sends it.
class OrderItemIn(BaseModel):
    # Docstring: clarifies the shape and the key rule -- prices are never accepted from the browser.
    """One cart line: { productId, size, quantity }. Never any prices."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # product_id: which product (matches the products table id); min_length=1 rejects empty strings.
    product_id: str = Field(min_length=1)
    # size: requested size as a string (e.g. "42"); validated against the product's sizes list later.
    size: str = Field(min_length=1)
    # quantity: how many pairs; ge=1 means quantity 0 or negative is rejected with 422.
    quantity: int = Field(ge=1)


# Define CustomerIn: the delivery-details block of the checkout form.
class CustomerIn(BaseModel):
    # Apply the shared camelCase config (city_state <-> cityState).
    model_config = _CAMEL

    # name: full name of the recipient; must not be empty.
    name: str = Field(min_length=1)
    # email: where the (future) confirmation goes; min_length=3 is a cheap non-empty check.
    email: str = Field(min_length=3)
    # phone: phone/WhatsApp number; min_length=7 rejects obviously fake entries.
    phone: str = Field(min_length=7)
    # address: street delivery address; must not be empty.
    address: str = Field(min_length=3)
    # city_state: "City, State" (e.g. "Ikeja, Lagos"); must not be empty.
    city_state: str = Field(min_length=2)
    # note: optional delivery note; `| None = None` means the key may be missing or null.
    note: str | None = None


# Define OrderIn: the full POST /orders request body.
class OrderIn(BaseModel):
    # Docstring: explains `confirmed` -- the "I have checked my order" checkbox must be ticked.
    """POST /orders body. `confirmed` must be true: the customer ticked the
    "I have checked my order" box before sending."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # items: the cart lines; min_length=1 rejects an empty cart with 422.
    items: list[OrderItemIn] = Field(min_length=1)
    # customer: nested delivery-details object defined above.
    customer: CustomerIn
    # confirmed: Literal[True] accepts ONLY true; false/missing is a 422.
    confirmed: Literal[True]


# Define OrderCreatedOut: the POST /orders success reply (plan section 3, step 7).
class OrderCreatedOut(BaseModel):
    # Docstring: points at the plan section that fixes this exact response shape.
    """POST /orders reply (BACKEND_PLAN.md section 3, step 7)."""

    # Apply the shared camelCase config (subtotal_kobo <-> subtotalKobo).
    model_config = _CAMEL

    # reference: human-friendly order id shown to the customer, e.g. "ADE-7K3Q9P".
    reference: str
    # status: order lifecycle state; starts as "submitted".
    status: str
    # subtotal_kobo: sum of line totals in kobo, computed from DB prices.
    subtotal_kobo: int
    # total_kobo: subtotal + delivery fee (fee is 0 until the owner sets one).
    total_kobo: int
    # created_at: when the order row was created (UTC timestamp from the DB).
    created_at: datetime


# Define OrderItemOut: one saved order line as returned by GET /orders.
class OrderItemOut(BaseModel):
    # Inline ConfigDict (not the shared _CAMEL) because this model ALSO needs from_attributes=True...
    # ...which lets OrderItemOut.model_validate(sqlalchemy_row) read attributes off a DB object.
    model_config = ConfigDict(
        # alias_generator: emit camelCase keys in JSON responses.
        alias_generator=to_camel,
        # populate_by_name: accept snake_case too when constructing in tests.
        populate_by_name=True,
        # from_attributes: read field values from ORM object attributes, not just dicts.
        from_attributes=True,
    )

    # product_id: the products-table id at order time.
    product_id: str
    # product_name: SNAPSHOT of the name charged; survives later renames of the product.
    product_name: str
    # size: the size ordered.
    size: str
    # quantity: how many pairs were ordered.
    quantity: int
    # unit_price_kobo: SNAPSHOT of the price charged per pair; survives later price changes.
    unit_price_kobo: int
    # line_total_kobo: unit price x quantity for this line.
    line_total_kobo: int


# Define OrderOut: one full order with its items, for GET /orders and GET /orders/{reference}.
class OrderOut(BaseModel):
    # Docstring: states which endpoints return this shape.
    """One order with its items, for GET /orders and GET /orders/{reference}."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # reference: human-friendly order id.
    reference: str
    # status: lifecycle state ("submitted", later: confirmed/delivered/...).
    status: str
    # items: the order's lines, each shaped as OrderItemOut.
    items: list[OrderItemOut]
    # subtotal_kobo: sum of the lines in kobo.
    subtotal_kobo: int
    # delivery_fee_kobo: currently always 0 (owner hasn't set fees).
    delivery_fee_kobo: int
    # total_kobo: subtotal + delivery fee.
    total_kobo: int
    # created_at: when the order was created.
    created_at: datetime
