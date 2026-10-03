"""Cart validation and money math.

Every price comes from the database, never from the browser (AGENTS.md cart
rules). Money is always integer kobo, so there are no rounding errors.
"""

# Import dataclass: turns PricedLine into a simple value holder with auto __init__/__eq__.
from dataclasses import dataclass

# Import Session: SQLAlchemy database session type; handing it in lets tests use SQLite.
from sqlalchemy.orm import Session

# Import OrderItemIn: the pydantic cart-line shape ({productId, size, quantity}) from the request.
from app.models.order import OrderItemIn
# Import the products DB model as product_row: the table we validate lines against.
from app.schemas.products import products as product_row


# Define CartValidationError: raised when any cart line fails validation.
# Subclasses Exception so endpoints can `except CartValidationError` and answer 400.
class CartValidationError(Exception):
    # Docstring: explains `problems` holds one message per bad line for the frontend to display.
    """One or more cart lines failed validation. `problems` has one message
    per bad line, so the frontend can show them all at once."""

    # Define __init__: builds the exception from the list of per-line problems.
    # problems: e.g. ["'X' is sold out in size 43.", "Unknown product 'p-9'."].
    def __init__(self, problems: list[str]):
        # super().__init__: set the exception message to all problems joined with "; ".
        super().__init__("; ".join(problems))
        # Store the list on the instance so the endpoint can return it as JSON {"errors": [...]}.
        self.problems = problems


# @dataclass: PricedLine gets __init__/__eq__ for free from its field annotations below.
@dataclass
# Define PricedLine: a cart line AFTER we looked up the real product and its real price.
class PricedLine:
    # Docstring: one line explaining what a PricedLine represents.
    """A cart line after we looked up the real product and price."""

    # product_id: the products-table id (e.g. "p-001").
    product_id: str
    # product_name: snapshot of the product name at order time (survives later renames).
    product_name: str
    # size: the size the customer asked for (e.g. "42").
    size: str
    # quantity: how many pairs of this line.
    quantity: int
    # unit_price_kobo: the DB price per pair in kobo -- never from the browser.
    unit_price_kobo: int
    # line_total_kobo: unit price x quantity for this line.
    line_total_kobo: int


# Define validate_and_price_cart: the single choke point for all cart money math.
# items: cart lines from the request body (already pydantic-validated for shape).
# db: the request's SQLAlchemy session (real Postgres in prod, SQLite in tests).
# -> tuple[list[PricedLine], int]: (priced lines, subtotal in kobo).
def validate_and_price_cart(items: list[OrderItemIn], db: Session) -> tuple[list[PricedLine], int]:
    # Docstring: contract -- returns priced lines + subtotal, or raises with every problem found.
    """Check every cart line against the products table and price it.

    Returns (priced lines, subtotal in kobo). Raises CartValidationError if
    any line is bad: unknown product, inactive product, unknown size, or a
    sold-out size.
    """
    # problems: collect ALL bad-line messages so the frontend can show them at once.
    problems: list[str] = []
    # lines: the successfully validated + priced lines, built up below.
    lines: list[PricedLine] = []

    # Walk the cart line by line; each line either appends a PricedLine or a problem.
    for item in items:
        # Load the product row by id; db.get returns None when the id doesn't exist.
        product = db.get(product_row, item.product_id)
        # Case 1: unknown product id (deleted, or a forged id from the browser).
        if product is None:
            # Record the problem and skip to the next line (continue = don't price this line).
            problems.append(f"Unknown product '{item.product_id}'.")
            continue
        # Case 2: product exists but is hidden (active=False means "cannot be ordered").
        if not product.active:
            # Record and skip: hidden products can never be bought, even by id.
            problems.append(f"'{product.name}' is not available to order right now.")
            continue

        # sizes: the product's JSON sizes list, or [] when the column is NULL (defensive).
        sizes = product.sizes or []
        # Find the size entry whose "size" matches the requested size (string-compared both sides).
        # next(..., None) returns the first match or None when the size doesn't exist.
        match = next((s for s in sizes if str(s.get("size")) == item.size), None)
        # Case 3: the product doesn't come in the requested size.
        if match is None:
            # Record and skip.
            problems.append(f"'{product.name}' does not come in size {item.size}.")
            continue
        # Case 4: the size exists but is sold out (available=False).
        if not match.get("available"):
            # Record and skip.
            problems.append(f"'{product.name}' in size {item.size} is sold out.")
            continue

        # Line is valid: price it from the DATABASE price and store a PricedLine.
        lines.append(
            # Build the priced line from the product row + the requested size/quantity.
            PricedLine(
                # product_id: copy the row id.
                product_id=product.id,
                # product_name: snapshot the name now (survives later renames).
                product_name=product.name,
                # size: the requested size string.
                size=item.size,
                # quantity: the requested quantity.
                quantity=item.quantity,
                # unit_price_kobo: THE database price -- the browser never supplies this.
                unit_price_kobo=product.price_kobo,
                # line_total_kobo: unit price times quantity, integer math, no rounding.
                line_total_kobo=product.price_kobo * item.quantity,
            )
        )

    # After all lines: if anything was bad, reject the whole cart with every reason.
    if problems:
        # Raise (not return) so the endpoint turns it into a 400 with all messages.
        raise CartValidationError(problems)

    # Success: return the priced lines plus the subtotal (sum of line totals; 0 for an empty cart).
    return lines, sum(line.line_total_kobo for line in lines)
