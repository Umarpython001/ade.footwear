// Import api: the shared axios instance (baseURL + Bearer token come from lib/api).
import { api } from "../lib/api";
// Import CartItem: the cart line shape ({productId, size, quantity}) owned by context/Cart.
import type { CartItem } from "../context/Cart";

// Talks to the FastAPI cart endpoints: GET /cart, PUT /cart, DELETE /cart.
// The Bearer token attaches automatically via lib/api; callers must only call
// these while signed in (otherwise the backend answers 401).

// CART_PATH: trailing slash matches the backend route (same convention as /orders/).
const CART_PATH = "/cart/";

// Define fetchRemoteCart: read the signed-in customer's server cart.
// -> Promise<CartItem[]>: oldest line first; empty array for a new customer.
export async function fetchRemoteCart(): Promise<CartItem[]> {
    // GET /cart/; the <{items}> type matches the CartOut wire shape.
    const { data } = await api.get<{ items: CartItem[] }>(CART_PATH);
    // Return the lines as-is.
    return data.items;
}

// Define replaceRemoteCart: overwrite the server cart with the given lines.
// items: the full cart (empty array clears it). -> Promise<CartItem[]>: the saved cart.
export async function replaceRemoteCart(items: CartItem[]): Promise<CartItem[]> {
    // PUT /cart/ with the whole cart; full-replace is idempotent, so retries are safe.
    const { data } = await api.put<{ items: CartItem[] }>(CART_PATH, { items });
    // Return what the server saved (deduped + capped).
    return data.items;
}
