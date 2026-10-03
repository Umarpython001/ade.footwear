# Import APIRouter: groups the two product routes under "/products" with the "products" docs tag.
from fastapi import APIRouter  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import Depends: injects one request-scoped database session into each handler.
from fastapi import Depends  # noqa: E402 -- same package, second name, own comment.
# Import HTTPException: aborts the slug lookup with 404 when nothing visible matches.
from fastapi import HTTPException  # noqa: E402 -- same package, third name, own comment.
# Import Path: validates the {slug} path segment (required string + docs description).
from fastapi import Path  # noqa: E402 -- same package, fourth name, own comment.
# Import Query: validates ?skip=/ ?limit= pagination params (ranges documented in /docs).
from fastapi import Query  # noqa: E402 -- same package, fifth name, own comment.
# Import Session: SQLAlchemy session type for the db argument.
from sqlalchemy.orm import Session

# Import get_db: dependency that yields the request's database session.
from app.core.database import get_db
# Import ProductListOut: the GET /products envelope shape ({skip, limit, data}).
from app.models.product import ProductListOut
# Import ProductOut: the single-product API shape (camelCase, no internal columns).
from app.models.product import ProductOut
# Import the products DB model as product_model: the table both handlers query.
# (Named product_model -- NOT products -- so no local variable can shadow the import.)
from app.schemas.products import products as product_model

# Create the router: both routes below are served under /products.
router = APIRouter(prefix="/products", tags=["products"])

# Comment: static routes come before /{slug}: FastAPI matches routes top to bottom,
# Comment: so a static path added later would otherwise be swallowed as a "slug".
# (Kept above the route definitions as a standing warning for future endpoints.)


# @router.get("/"): handle GET /products (one page); reply shape fixed as ProductListOut.
@router.get("/", response_model=ProductListOut)
# Define get_products: the paginated list handler.
# skip: ?skip=, rows to skip (>= 0). limit: ?limit=, page size (1..100). db: request session.
def get_products(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of items to return per page"),
    db: Session = Depends(get_db),
):
    # Comment: only active products are visible in the shop (BACKEND_PLAN.md section 5).
    # Query the products table filtered to active rows, then apply paging: OFFSET skip LIMIT limit.
    items = (
        # FROM products WHERE active IS TRUE.
        db.query(product_model)
        .filter(product_model.active.is_(True))
        # OFFSET skip: skip the first `skip` rows.
        .offset(skip)
        # LIMIT limit: take at most `limit` rows.
        .limit(limit)
        # .all(): execute and return the page as a list of rows.
        .all()
    )

    # Build the envelope: echo the paging inputs plus the page (rows auto-convert via from_attributes).
    return ProductListOut(skip=skip, limit=limit, data=items)


# @router.get("/{slug}"): handle GET /products/<slug>; reply shape fixed as ProductOut.
@router.get("/{slug}", response_model=ProductOut)
# Define get_product_by_slug: the single-product handler.
# slug: the {slug} path segment (required). db: request session.
def get_product_by_slug(
    slug: str = Path(..., description="The slug of the product to retrieve"),
    db: Session = Depends(get_db),
):
    # Comment: a hidden product answers 404, same as an unknown slug, so the shop does
    # Comment: not reveal which slugs exist but are inactive.
    # Query by BOTH slug and active: hidden products simply don't match, like unknown slugs.
    product = (
        # FROM products WHERE slug = <slug> AND active IS TRUE.
        db.query(product_model)
        .filter(product_model.slug == slug, product_model.active.is_(True))
        # .first(): one row or None.
        .first()
    )
    # No visible match: answer 404 (caller can't tell "unknown" from "hidden").
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    # Match: return the row; FastAPI shapes it as ProductOut (internal columns dropped).
    return product
