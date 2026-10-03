"""Seed the products table with the ADE dummy catalogue.

Replaces ALL existing products (delete + insert), so run it deliberately:

    venv\\Scripts\\activate
    python seed_products.py

The data mirrors frontend/src/data/products.ts, which is marked [PLACEHOLDER]:
real ADE photos, invented names/prices/descriptions until the owner approves
final copy. Image srcs are paths served by the frontend (frontend/public),
so they resolve on the frontend's origin, locally and on Vercel.
"""

from app.core.database import SessionLocal
from app.schemas.products import products as product_row

ADULT_SIZES = ["39", "40", "41", "42", "43", "44", "45"]


def sizes(sold_out=()):
    return [{"size": s, "available": s not in sold_out} for s in ADULT_SIZES]


def image(slug, alt, focus):
    return [{"src": f"/images/products/{slug}.png", "alt": alt, "focus": focus}]


ADE_PRODUCTS = [
    {
        "id": "p-001",
        "slug": "woven-buckle-derby",
        "name": "Woven Buckle Derby",
        "description": "Black woven-texture leather derby with a side buckle strap, contrast welt stitching and a chunky lug sole.",
        "category": "Shoes",
        "price_kobo": 5_800_000,
        "images": image(
            "woven-buckle-derby",
            "Pair of black woven-leather derby shoes with buckle straps and thick lug soles, held up beside an Ade Foot Wear box",
            "50% 55%",
        ),
        "sizes": sizes(sold_out={"45"}),
        "active": True,
        "featured": True,
    },
    {
        "id": "p-002",
        "slug": "two-strap-leather-slides",
        "name": "Two-Strap Leather Slides",
        "description": "Open-toe slides with two wide black leather straps on a cushioned footbed and a raised black sole.",
        "category": "Sandals",
        "price_kobo": 3_200_000,
        "images": image(
            "two-strap-leather-slides",
            "Pair of black two-strap leather slides on a wooden table next to Ade Foot Wear stickers",
            "50% 55%",
        ),
        "sizes": sizes(sold_out={"39", "40"}),
        "active": True,
        "featured": True,
    },
    {
        "id": "p-003",
        "slug": "classic-lug-derby",
        "name": "Classic Lug Derby",
        "description": "Smooth black leather lace-up derby on a deep-tread lug sole. Clean enough for the office, sturdy enough for the street.",
        "category": "Shoes",
        "price_kobo": 4_500_000,
        "images": image(
            "classic-lug-derby",
            "Black smooth-leather derby shoe with a thick lug sole held in hand above a wooden bench",
            "50% 92%",
        ),
        "sizes": sizes(),
        "active": True,
        "featured": True,
    },
    {
        "id": "p-004",
        "slug": "v-buckle-mules",
        "name": "V-Buckle Mules",
        "description": "Backless black leather mules with a crossover vamp, metal V hardware and a tan scalloped insole.",
        "category": "Slippers",
        "price_kobo": 2_800_000,
        "images": image(
            "v-buckle-mules",
            "Pair of black leather backless mules with silver V hardware and tan insoles on a polished wooden floor",
            "50% 50%",
        ),
        # Every size sold out: stays visible but greys out in the shop,
        # matching the old dummy data's available=false.
        "sizes": sizes(sold_out=set(ADULT_SIZES)),
        "active": True,
        "featured": True,
    },
]


def main():
    db = SessionLocal()
    try:
        deleted = db.query(product_row).delete()
        for data in ADE_PRODUCTS:
            db.add(product_row(**data))
        db.commit()
        print(f"deleted {deleted} old products, seeded {len(ADE_PRODUCTS)} ADE products")
        for data in ADE_PRODUCTS:
            print(f"  {data['id']}  {data['slug']:<26} {data['price_kobo']:>9} kobo")
    finally:
        db.close()


if __name__ == "__main__":
    main()
