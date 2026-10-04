"""API models for the cart endpoints.

Field names are snake_case in Python and camelCase on the wire, because that
is what JavaScript expects: `product_id` here is `productId` in the JSON.
A cart line is { productId, size, quantity }. Never any prices.
"""

# Import BaseModel: pydantic base class; validates input and serializes output.
from pydantic import BaseModel  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import ConfigDict: per-model settings (here: camelCase conversion on the wire).
from pydantic import ConfigDict  # noqa: E402 -- same package, second name, own comment.
# Import Field: adds validation rules (min length, value ranges) to a field.
from pydantic import Field  # noqa: E402 -- same package, third name, own comment.
# Import to_camel: converts snake_case names to camelCase for JSON (product_id -> productId).
from pydantic.alias_generators import to_camel

# _CAMEL: shared config; every model using it accepts snake_case in Python and emits camelCase JSON.
# populate_by_name=True lets tests/builders use either naming style when constructing objects.
_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# Define CartItemIn: one cart line as the browser sends it (same shape as OrderItemIn).
class CartItemIn(BaseModel):
    # Docstring: clarifies the shape and the key rule -- prices are never accepted from the browser.
    """One cart line: { productId, size, quantity }. Never any prices."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # product_id: which product (matches the products table id); min_length=1 rejects empty strings.
    product_id: str = Field(min_length=1)
    # size: requested size as a string (e.g. "42"); validated against the product's sizes at checkout.
    size: str = Field(min_length=1)
    # quantity: how many pairs; ge=1 rejects 0/negative with 422, le=99 caps a single line.
    quantity: int = Field(ge=1, le=99)


# Define CartReplaceIn: the PUT /cart body -- the customer's whole cart in one shot.
class CartReplaceIn(BaseModel):
    # Docstring: explains full-replace semantics (simple, idempotent, sync-friendly).
    """PUT /cart body. Replaces the whole server cart with `items`
    (empty list clears it). Retrying the same body is a no-op."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # items: the full cart; an empty list is valid and clears the cart.
    items: list[CartItemIn] = Field(default_factory=list)


# Define CartItemOut: one saved cart line as returned by GET /cart.
class CartItemOut(BaseModel):
    # Inline ConfigDict (not the shared _CAMEL) because this model ALSO needs from_attributes=True...
    # ...which lets CartItemOut.model_validate(sqlalchemy_row) read attributes off a DB object.
    model_config = ConfigDict(
        # alias_generator: emit camelCase keys in JSON responses.
        alias_generator=to_camel,
        # populate_by_name: accept snake_case too when constructing in tests.
        populate_by_name=True,
        # from_attributes: read field values from ORM object attributes, not just dicts.
        from_attributes=True,
    )

    # product_id: the products-table id.
    product_id: str
    # size: the requested size string.
    size: str
    # quantity: how many pairs.
    quantity: int


# Define CartOut: the customer's whole cart, for GET /cart and PUT /cart replies.
class CartOut(BaseModel):
    # Docstring: states which endpoints return this shape.
    """The signed-in customer's cart, oldest line first."""

    # Apply the shared camelCase config to this model.
    model_config = _CAMEL

    # items: every cart line, shaped as CartItemOut.
    items: list[CartItemOut]
