# Import Column: maps each attribute below to a database column.
from sqlalchemy import Column  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import DateTime: created_at/updated_at column type.
from sqlalchemy import DateTime  # noqa: E402 -- same package, second name, own comment.
# Import Integer: quantity column type.
from sqlalchemy import Integer  # noqa: E402 -- same package, third name, own comment.
# Import String: id/user/product/size column type.
from sqlalchemy import String  # noqa: E402 -- same package, fourth name, own comment.
# Import UniqueConstraint: one row per (user, product, size); duplicates become updates, not rows.
from sqlalchemy import UniqueConstraint  # noqa: E402 -- same package, fifth name, own comment.
# Import func: provides now() for the created_at/updated_at server defaults.
from sqlalchemy.sql import func
# Import uuid: generates the random primary-key values for new rows.
import uuid

# Import Base: the declarative base every DB model inherits from (tables register on its metadata).
from ..core.database import Base


# Define cart_items: one row per signed-in customer's cart line (the server-side cart).
# A cart line is { productId, size, quantity }: no prices live here, exactly like the
# local cart (AGENTS.md cart rules) -- totals are always derived from current product data.
class cart_items(Base):
    # __tablename__: the Postgres table name Supabase shows in the Table Editor.
    __tablename__ = 'cart_items'

    # id: random UUID primary key (never exposed to the frontend).
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # user_id: the Supabase auth.users.id of the owner, ALWAYS from the verified
    # access token (never from the request body) -- the same guarantee as orders.user_id.
    user_id = Column(String, nullable=False, index=True)
    # product_id: which product (matches the products table id).
    product_id = Column(String, nullable=False)
    # size: the requested size string (e.g. "42").
    size = Column(String, nullable=False)
    # quantity: how many pairs; application code caps this at 99.
    quantity = Column(Integer, nullable=False)
    # created_at: when the line was first saved.
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # updated_at: bumped by the database on every update.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # One row per (user, product, size): adding the same line twice updates it instead of duplicating.
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", "size", name="uq_cart_user_product_size"),
    )
