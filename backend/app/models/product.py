"""API model for GET /products and GET /products/{slug} (BACKEND_PLAN.md s.6).

snake_case in Python, camelCase on the wire. Internal columns (active,
created_at, updated_at) are deliberately NOT exposed.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class ProductImageOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    src: str
    alt: str = ""
    focus: str = "center"


class ProductSizeOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    size: str
    available: bool

    @field_validator("size", mode="before")
    @classmethod
    def _size_to_str(cls, value):
        # Seed data stores sizes as strings ("S", "42"); coerce just in case
        # a numeric size ever slips in.
        return str(value)


class ProductOut(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: str
    slug: str
    name: str
    description: str | None = None
    category: str
    price_kobo: int
    images: list[ProductImageOut] = []
    sizes: list[ProductSizeOut] = []
    featured: bool = False

    @field_validator("images", "sizes", mode="before")
    @classmethod
    def _none_to_empty_list(cls, value):
        # These columns are nullable; the frontend always gets a list.
        return value if value is not None else []


class ProductListOut(BaseModel):
    """GET /products reply: one page of products plus the paging inputs."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    skip: int
    limit: int
    data: list[ProductOut]
