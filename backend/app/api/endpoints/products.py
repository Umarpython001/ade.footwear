from fastapi import APIRouter, Depends, Query

from app.core.database import get_db
from app.schemas.products import products as product_model

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/")
def get_products(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of items to return per page"),
    db=Depends(get_db),
):
    # Page through the products table; `skip`/`limit` come from the query string.
    items = db.query(product_model).offset(skip).limit(limit).all()

    return {
        "skip": skip,
        "limit": limit,
        "data": items,
    }
