"""Cart validation and money math.

Every price comes from the database, never from the browser (AGENTS.md cart
rules). Money is always integer kobo, so there are no rounding errors.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.order import OrderItemIn
from app.schemas.products import products as product_row


class CartValidationError(Exception):
    """One or more cart lines failed validation. `problems` has one message
    per bad line, so the frontend can show them all at once."""

    def __init__(self, problems: list[str]):
        super().__init__("; ".join(problems))
        self.problems = problems


@dataclass
class PricedLine:
    """A cart line after we looked up the real product and price."""

    product_id: str
    product_name: str
    size: str
    quantity: int
    unit_price_kobo: int
    line_total_kobo: int


def validate_and_price_cart(items: list[OrderItemIn], db: Session) -> tuple[list[PricedLine], int]:
    """Check every cart line against the products table and price it.

    Returns (priced lines, subtotal in kobo). Raises CartValidationError if
    any line is bad: unknown product, inactive product, unknown size, or a
    sold-out size.
    """
    problems: list[str] = []
    lines: list[PricedLine] = []

    for item in items:
        product = db.get(product_row, item.product_id)
        if product is None:
            problems.append(f"Unknown product '{item.product_id}'.")
            continue
        if not product.active:
            problems.append(f"'{product.name}' is not available to order right now.")
            continue

        sizes = product.sizes or []
        match = next((s for s in sizes if str(s.get("size")) == item.size), None)
        if match is None:
            problems.append(f"'{product.name}' does not come in size {item.size}.")
            continue
        if not match.get("available"):
            problems.append(f"'{product.name}' in size {item.size} is sold out.")
            continue

        lines.append(
            PricedLine(
                product_id=product.id,
                product_name=product.name,
                size=item.size,
                quantity=item.quantity,
                unit_price_kobo=product.price_kobo,
                line_total_kobo=product.price_kobo * item.quantity,
            )
        )

    if problems:
        raise CartValidationError(problems)

    return lines, sum(line.line_total_kobo for line in lines)
