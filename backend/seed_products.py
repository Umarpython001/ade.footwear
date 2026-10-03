"""Seed the products table with the ADE dummy catalogue.

Replaces ALL existing products (delete + insert), so run it deliberately:

    venv\\Scripts\\activate
    python seed_products.py

The data mirrors frontend/src/data/products.ts, which is marked [PLACEHOLDER]:
real ADE photos, invented names/prices/descriptions until the owner approves
final copy. Image srcs are paths served by the frontend (frontend/public),
so they resolve on the frontend's origin, locally and on Vercel.
"""

# Import SessionLocal: factory for one database session (bound to Supabase Postgres).
from app.core.database import SessionLocal
# Import the products DB model as product_row: the table we wipe and refill.
from app.schemas.products import products as product_row

# ADULT_SIZES: the full size run every ADE dummy product is built from.
ADULT_SIZES = ["39", "40", "41", "42", "43", "44", "45"]


# Define sizes: build the JSON sizes list for one product, marking some sizes sold out.
# sold_out: sizes to flag unavailable (defaults to () = everything available).
# -> list of {"size": <label>, "available": <bool>} dicts, one per size in ADULT_SIZES.
def sizes(sold_out=()):
    # For each size s: available unless s is in the sold_out collection.
    return [{"size": s, "available": s not in sold_out} for s in ADULT_SIZES]


# Define image: build the one-photo JSON images list for a product.
# slug: used to form the image path. alt: accessibility text. focus: CSS crop position.
# -> [{"src": "/images/products/<slug>.png", "alt": ..., "focus": ...}].
def image(slug, alt, focus):
    # f-string builds the frontend-served path; alt/focus are stored verbatim.
    return [{"src": f"/images/products/{slug}.png", "alt": alt, "focus": focus}]


# ADE_PRODUCTS: the 4 dummy products; each dict's keys match the products table columns.
ADE_PRODUCTS = [
    # Product 1: woven derby, size 45 sold out.
    {
        # id: stable products-table key used by carts/orders ("p-001").
        "id": "p-001",
        # slug: URL id for /products/woven-buckle-derby.
        "slug": "woven-buckle-derby",
        # name: display name.
        "name": "Woven Buckle Derby",
        # description: placeholder copy until the owner approves final text.
        "description": "Black woven-texture leather derby with a side buckle strap, contrast welt stitching and a chunky lug sole.",
        # category: shop grouping ("Shoes").
        "category": "Shoes",
        # price_kobo: 5,800,000 kobo = N58,000.
        "price_kobo": 5_800_000,
        # images: one photo built by the image() helper above.
        "images": image(
            # slug: reuses the product slug for the file name.
            "woven-buckle-derby",
            # alt: descriptive text for screen readers.
            "Pair of black woven-leather derby shoes with buckle straps and thick lug soles, held up beside an Ade Foot Wear box",
            # focus: crop position for portrait photos.
            "50% 55%",
        ),
        # sizes: full run with 45 sold out; set {"45"} = sizes() marks it unavailable.
        "sizes": sizes(sold_out={"45"}),
        # active: True = visible in the shop and orderable.
        "active": True,
        # featured: True = appears in the homepage featured grid.
        "featured": True,
    },
    # Product 2: slides, small sizes sold out.
    {
        # id: stable key "p-002".
        "id": "p-002",
        # slug: URL id.
        "slug": "two-strap-leather-slides",
        # name: display name.
        "name": "Two-Strap Leather Slides",
        # description: placeholder copy.
        "description": "Open-toe slides with two wide black leather straps on a cushioned footbed and a raised black sole.",
        # category: "Sandals" grouping.
        "category": "Sandals",
        # price_kobo: 3,200,000 kobo = N32,000.
        "price_kobo": 3_200_000,
        # images: one photo for the slides.
        "images": image(
            # slug: file name base.
            "two-strap-leather-slides",
            # alt: descriptive text.
            "Pair of black two-strap leather slides on a wooden table next to Ade Foot Wear stickers",
            # focus: crop position.
            "50% 55%",
        ),
        # sizes: 39 and 40 sold out.
        "sizes": sizes(sold_out={"39", "40"}),
        # active: visible and orderable.
        "active": True,
        # featured: in the homepage grid.
        "featured": True,
    },
    # Product 3: classic derby, everything available.
    {
        # id: stable key "p-003".
        "id": "p-003",
        # slug: URL id.
        "slug": "classic-lug-derby",
        # name: display name.
        "name": "Classic Lug Derby",
        # description: placeholder copy.
        "description": "Smooth black leather lace-up derby on a deep-tread lug sole. Clean enough for the office, sturdy enough for the street.",
        # category: "Shoes" grouping.
        "category": "Shoes",
        # price_kobo: 4,500,000 kobo = N45,000.
        "price_kobo": 4_500_000,
        # images: one photo for the derby.
        "images": image(
            # slug: file name base.
            "classic-lug-derby",
            # alt: descriptive text.
            "Black smooth-leather derby shoe with a thick lug sole held in hand above a wooden bench",
            # focus: crop position (92% = lower crop for this shot).
            "50% 92%",
        ),
        # sizes: no sold_out argument = every size available.
        "sizes": sizes(),
        # active: visible and orderable.
        "active": True,
        # featured: in the homepage grid.
        "featured": True,
    },
    # Product 4: mules, EVERY size sold out (greys out in the shop, like available=false before).
    {
        # id: stable key "p-004".
        "id": "p-004",
        # slug: URL id.
        "slug": "v-buckle-mules",
        # name: display name.
        "name": "V-Buckle Mules",
        # description: placeholder copy.
        "description": "Backless black leather mules with a crossover vamp, metal V hardware and a tan scalloped insole.",
        # category: "Slippers" grouping.
        "category": "Slippers",
        # price_kobo: 2,800,000 kobo = N28,000.
        "price_kobo": 2_800_000,
        # images: one photo for the mules.
        "images": image(
            # slug: file name base.
            "v-buckle-mules",
            # alt: descriptive text.
            "Pair of black leather backless mules with silver V hardware and tan insoles on a polished wooden floor",
            # focus: centered crop.
            "50% 50%",
        ),
        # Comment: every size sold out: stays visible but greys out in the shop,
        # Comment: matching the old dummy data's available=false.
        # sizes: sold_out=set(ADULT_SIZES) marks the whole run unavailable.
        "sizes": sizes(sold_out=set(ADULT_SIZES)),
        # active: still True (visible) -- sold-out is per-size, not hidden.
        "active": True,
        # featured: still in the homepage grid (greyed out).
        "featured": True,
    },
]


# Define main: wipe the table and insert the 4 ADE products.
def main():
    # Open one database session for the whole seed run.
    db = SessionLocal()
    # try/finally: the session is closed even if the delete/insert fails halfway.
    try:
        # Delete EVERY product row; returns the count for the log line below.
        deleted = db.query(product_row).delete()
        # Stage one row per dict in ADE_PRODUCTS (**data unpacks the dict into columns).
        for data in ADE_PRODUCTS:
            db.add(product_row(**data))
        # Commit the delete + inserts atomically.
        db.commit()
        # Log what happened: e.g. "deleted 100 old products, seeded 4 ADE products".
        print(f"deleted {deleted} old products, seeded {len(ADE_PRODUCTS)} ADE products")
        # Log each seeded product's id, slug and price for eyeball verification.
        for data in ADE_PRODUCTS:
            print(f"  {data['id']}  {data['slug']:<26} {data['price_kobo']:>9} kobo")
    # finally: always run, success or failure.
    finally:
        # Close the session, returning the connection to the pool.
        db.close()


# Standard guard: main() runs only when this file is executed directly (python seed_products.py)...
# ...not when it is imported elsewhere.
if __name__ == "__main__":
    # Kick off the seed.
    main()
