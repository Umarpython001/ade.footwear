"""Collects every endpoint group into one router that main.py plugs in.

Each new file in app/api/endpoints/ gets one include_router line here.
"""

from fastapi import APIRouter

from app.api.endpoints import home, orders, products, cart


api_router = APIRouter()
api_router.include_router(home.router)
api_router.include_router(orders.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
