from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import ProductListOut, ProductOut
from app.schemas.products import products as product_model

router = APIRouter(prefix="/products", tags=["products"])

# Static routes come before /{slug}: FastAPI matches routes top to bottom,
# so a static path added later would otherwise be swallowed as a "slug".


@router.get("/", response_model=ProductListOut)
def get_products(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of items to return per page"),
    db: Session = Depends(get_db),
):
    # Only active products are visible in the shop (BACKEND_PLAN.md section 5).
    items = (
        db.query(product_model)
        .filter(product_model.active.is_(True))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return ProductListOut(skip=skip, limit=limit, data=items)


@router.get("/{slug}", response_model=ProductOut)
def get_product_by_slug(
    slug: str = Path(..., description="The slug of the product to retrieve"),
    db: Session = Depends(get_db),
):
    # A hidden product answers 404, same as an unknown slug, so the shop does
    # not reveal which slugs exist but are inactive.
    product = (
        db.query(product_model)
        .filter(product_model.slug == slug, product_model.active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product
