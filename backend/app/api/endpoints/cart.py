"""Cart endpoints: the signed-in customer's server-side cart.

These handlers stay thin: read the request, call business logic, return the
response. The rules live in app/business_logic/cart.py.
"""

# Import APIRouter: groups these routes under the "/cart" prefix with the "cart" tag.
from fastapi import APIRouter  # noqa: E402 -- noqa keeps linters quiet about import order.
# Import Depends: declares injectable needs (database session, verified user) in each handler's signature.
from fastapi import Depends  # noqa: E402 -- same package, second name, own comment.
# Import Session: SQLAlchemy session type for the db argument.
from sqlalchemy.orm import Session

# Import the business-logic module as cart_logic: get/replace/clear rules.
from app.business_logic import cart as cart_logic
# Import CurrentUser: the verified identity type (id from the token, never the body).
from app.core.auth import CurrentUser
# Import get_current_user: the dependency that verifies the Bearer token or raises 401.
from app.core.auth import get_current_user
# Import get_db: dependency that yields one request-scoped database session.
from app.core.database import get_db
# Import CartItemOut: one saved cart line in API responses.
from app.models.cart import CartItemOut
# Import CartOut: the whole-cart response shape for GET and PUT.
from app.models.cart import CartOut
# Import CartReplaceIn: validated PUT /cart body shape (full cart, possibly empty).
from app.models.cart import CartReplaceIn
# Import cart_items DB model as cart_item_row: row type for the _to_cart_out argument.
from app.schemas.cart import cart_items as cart_item_row

# Create the router: every route below is served under /cart and grouped as "cart" in /docs.
router = APIRouter(prefix="/cart", tags=["cart"])


# Define _to_cart_out: convert cart-item ROWS into the whole-cart API SHAPE.
# rows: the customer's cart-item rows. -> CartOut: the JSON body.
def _to_cart_out(rows: list[cart_item_row]) -> CartOut:
    # Build the response; each row is validated into a CartItemOut via from_attributes.
    return CartOut(items=[CartItemOut.model_validate(row) for row in rows])


# @router.get("/"): handle GET /cart (read the server cart); reply shape fixed as CartOut.
@router.get("/", response_model=CartOut)
# Define get_cart: the read handler; only signed-in callers reach here (401 otherwise).
# db: request session. user: verified caller whose id filters the rows.
def get_cart(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: states the ownership guarantee.
    """The signed-in customer's server cart, oldest line first."""
    # Fetch this user's rows and convert each row to its API shape.
    return _to_cart_out(cart_logic.get_cart(db, user.id))


# @router.put("/"): handle PUT /cart (replace the server cart); reply is the saved cart.
@router.put("/", response_model=CartOut)
# Define replace_cart: the sync handler. Full replace = idempotent, retry-safe.
# payload: JSON body validated as CartReplaceIn (422 on bad shape).
# db: request session via get_db. user: verified caller via get_current_user (401 when bad/missing).
def replace_cart(
    payload: CartReplaceIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: states the two security guarantees of this endpoint.
    """Replace the whole server cart. The user id comes from the verified token
    and no prices are accepted; the browser sends only { productId, size, quantity } lines."""
    # Swap the cart atomically (delete + insert in one transaction) and shape the reply.
    return _to_cart_out(cart_logic.replace_cart(db, user.id, payload.items))


# @router.delete("/"): handle DELETE /cart (empty the server cart); reply is the empty cart.
@router.delete("/", response_model=CartOut)
# Define clear_cart: the empty handler.
# db: request session. user: verified caller whose rows are deleted.
def clear_cart(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Docstring: states only the caller's rows are touched.
    """Empty the signed-in customer's server cart."""
    # Delete this user's lines, then answer with the (empty) cart shape.
    cart_logic.clear_cart(db, user.id)
    return CartOut(items=[])
