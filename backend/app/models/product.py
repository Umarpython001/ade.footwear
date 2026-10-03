"""API model for GET /products and GET /products/{slug} (BACKEND_PLAN.md s.6).

snake_case in Python, camelCase on the wire. Internal columns (active,
created_at, updated_at) are deliberately NOT exposed.
"""

# Import BaseModel: pydantic base class for request/response shapes with validation.
from pydantic import BaseModel  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import ConfigDict: per-model settings (camelCase output, ORM attribute reading).
from pydantic import ConfigDict  # noqa: E402 -- same package, second name, own comment.
# Import field_validator: decorator for custom per-field cleanup before validation.
from pydantic import field_validator  # noqa: E402 -- same package, third name, own comment.
# Import to_camel: converts snake_case field names to camelCase JSON keys.
from pydantic.alias_generators import to_camel


# Define ProductImageOut: one product photo as the frontend receives it.
class ProductImageOut(BaseModel):
    # Config: emit camelCase keys; accept snake_case when constructing in Python too.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    # src: image URL or frontend-served path (e.g. "/images/products/<slug>.png").
    src: str
    # alt: accessibility text; defaults to "" when the DB row has none.
    alt: str = ""
    # focus: CSS object-position for cropping portrait photos (e.g. "50% 55%").
    focus: str = "center"


# Define ProductSizeOut: one size entry with its availability flag.
class ProductSizeOut(BaseModel):
    # Config: camelCase on the wire, same as above.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    # size: the size label as a string (e.g. "42").
    size: str
    # available: True = can be ordered; False = sold out in this size.
    available: bool

    # @field_validator("size", mode="before"): run _size_to_str on the raw size BEFORE type checks.
    @field_validator("size", mode="before")
    # @classmethod: validator is called on the class, not an instance (pydantic requirement).
    @classmethod
    # Define _size_to_str: coerce any size value to a string.
    # cls: the model class (unused but required by classmethod signature).
    # value: the raw size from the DB (usually str, occasionally a number).
    def _size_to_str(cls, value):
        # Comment: seed data stores sizes as strings ("S", "42"); coerce just in case
        # Comment: a numeric size ever slips in.
        # str(value): "42" stays "42"; numeric 42 becomes "42".
        return str(value)


# Define ProductOut: one product as GET /products and GET /products/{slug} return it.
class ProductOut(BaseModel):
    # Config: camelCase output + accept snake_case input + read from ORM objects via attributes.
    model_config = ConfigDict(
        # alias_generator: emit camelCase keys (price_kobo -> priceKobo).
        alias_generator=to_camel,
        # populate_by_name: also accept snake_case keys when constructing.
        populate_by_name=True,
        # from_attributes: allow ProductOut.model_validate(sqlalchemy_row) to read row attributes.
        from_attributes=True,
    )

    # id: products-table primary key (e.g. "p-001").
    id: str
    # slug: URL-friendly name used in /products/<slug>.
    slug: str
    # name: display name (e.g. "Woven Buckle Derby").
    name: str
    # description: long text; None when the DB has NULL (frontend maps it to "").
    description: str | None = None
    # category: product category string (e.g. "Shoes").
    category: str
    # price_kobo: price in integer kobo (1 naira = 100 kobo); no decimals, no rounding errors.
    price_kobo: int
    # images: list of photo objects; defaults to [] when the DB has NULL (via validator below).
    images: list[ProductImageOut] = []
    # sizes: list of size objects; defaults to [] when the DB has NULL.
    sizes: list[ProductSizeOut] = []
    # featured: True = shown in the homepage featured grid.
    featured: bool = False
    # NOTE: `active`, `created_at`, `updated_at` are intentionally absent: never exposed to browsers.

    # @field_validator on BOTH images and sizes, mode="before": normalize NULLs before validation.
    @field_validator("images", "sizes", mode="before")
    # @classmethod: pydantic requires validators to be classmethods.
    @classmethod
    # Define _none_to_empty_list: turn a NULL column into an empty list.
    # cls: the model class (unused, required by signature).
    # value: raw DB value for images or sizes (a list, or None when the column is NULL).
    def _none_to_empty_list(cls, value):
        # Comment: these columns are nullable; the frontend always gets a list.
        # Keep lists as-is; replace None with [] so the frontend never receives null.
        return value if value is not None else []


# Define ProductListOut: the GET /products reply envelope (page + paging echo).
class ProductListOut(BaseModel):
    # Docstring: explains this is the list endpoint's envelope shape.
    """GET /products reply: one page of products plus the paging inputs."""

    # Config: camelCase output for the envelope keys too.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    # skip: how many products were skipped (echoes the ?skip= query param).
    skip: int
    # limit: page size requested (echoes the ?limit= query param).
    limit: int
    # data: the page of products, each shaped as ProductOut.
    data: list[ProductOut]
