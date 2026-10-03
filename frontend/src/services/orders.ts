// Import api: the shared axios instance (baseURL + Bearer token come from lib/api).
import { api } from "../lib/api";
// Import axios helpers: isAxiosError narrows failures; AxiosError types the 400 detail shape.
import { isAxiosError } from "axios";
import type { AxiosError } from "axios";

// Talks to the FastAPI orders endpoints: POST /orders, GET /orders, GET /orders/{reference}.
// Prices and totals always come from the backend; the browser never sends or computes money.

// Define OrderCreated: the POST /orders reply (reference + totals for the confirmation page).
export interface OrderCreated {
    // reference: human-friendly id shown to the customer, e.g. "ADE-7K3Q9P".
    reference: string;
    // status: lifecycle state; starts as "submitted".
    status: string;
    // subtotalKobo: sum of the lines in kobo.
    subtotalKobo: number;
    // totalKobo: subtotal + delivery fee (fee is 0 until the owner sets one).
    totalKobo: number;
    // createdAt: ISO timestamp of when the order was saved.
    createdAt: string;
}

// Define OrderItem: one saved order line with price snapshots frozen at order time.
export interface OrderItem {
    // productId: the products-table id.
    productId: string;
    // productName: snapshot of the name charged (survives later renames).
    productName: string;
    // size: the size ordered.
    size: string;
    // quantity: how many pairs.
    quantity: number;
    // unitPriceKobo: snapshot of the price charged per pair.
    unitPriceKobo: number;
    // lineTotalKobo: unit price x quantity.
    lineTotalKobo: number;
}

// Define Order: one full order with its items, for the confirmation and history pages.
export interface Order {
    // reference: human-friendly id used in URLs (/order-confirmed/:reference).
    reference: string;
    // status: lifecycle state.
    status: string;
    // items: the order's lines.
    items: OrderItem[];
    // subtotalKobo: sum of the lines.
    subtotalKobo: number;
    // deliveryFeeKobo: currently always 0.
    deliveryFeeKobo: number;
    // totalKobo: subtotal + fee.
    totalKobo: number;
    // createdAt: ISO timestamp.
    createdAt: string;
}

// Define CheckoutPayload: the POST /orders body (cart + delivery details, never prices).
export interface CheckoutPayload {
    // items: cart lines as {productId, size, quantity}.
    items: Array<{ productId: string; size: string; quantity: number }>;
    // customer: delivery details from the checkout form.
    customer: {
        // name: recipient full name.
        name: string;
        // email: recipient email.
        email: string;
        // phone: phone or WhatsApp number.
        phone: string;
        // address: street address.
        address: string;
        // cityState: "City, State".
        cityState: string;
        // note: optional delivery note (null when blank).
        note: string | null;
    };
    // confirmed: always true (the checkbox is required before sending).
    confirmed: true;
}

// Define OrderSubmitError: thrown when the backend rejects the checkout with per-line messages.
// message: joined summary. lines: one message per bad cart line for the UI to list.
export class OrderSubmitError extends Error {
    // lines: the backend's per-line problems (unknown product, sold-out size, ...).
    lines: string[];
    // Construct with the message list; super(message) sets the joined text.
    constructor(lines: string[]) {
        super(lines.join(" "));
        // name: identifies this error class in logs ("OrderSubmitError", not generic "Error").
        this.name = "OrderSubmitError";
        // Store the list for the checkout page to render as bullets.
        this.lines = lines;
    }
}

// Define createOrder: send the checkout to the backend and return the created (or replayed) order.
// payload: cart + customer + confirmed. key: random UUID for this attempt (stops double orders).
// -> Promise<OrderCreated>: reference + totals for the confirmation page.
export async function createOrder(payload: CheckoutPayload, key: string): Promise<OrderCreated> {
    // try: the POST raises on 400/401/422; we translate 400 below and re-throw the rest.
    try {
        // POST /orders/ with the Idempotency-Key header; <OrderCreated> types the reply body.
        const { data } = await api.post<OrderCreated>("/orders/", payload, {
            headers: { "Idempotency-Key": key },
        });
        // Success (201 first time, 200 on idempotent replay): hand the reply to the caller.
        return data;
        // catch: classify the failure for the checkout page.
    } catch (error: unknown) {
        // 400 with {detail: {errors: [...]}}: cart validation failed -- wrap in OrderSubmitError.
        if (isAxiosError(error)) {
            // Read the backend's per-line messages, tolerating any unexpected shape.
            const detail = (error as AxiosError<{ detail: { errors?: string[] } | string }>).response?.data
                ?.detail;
            // detail.errors is the string array; fall back to the raw detail or status text.
            const lines =
                typeof detail === "object" && detail?.errors
                    ? detail.errors
                    : [typeof detail === "string" ? detail : "Your order could not be placed."];
            // Only 400s become OrderSubmitError; 401/422/500 re-throw untouched for generic handling.
            if (error.response?.status === 400) {
                throw new OrderSubmitError(lines);
            }
        }
        // Not a cart problem (network, 401, 500): re-throw for the generic error path.
        throw error;
    }
}

// Define getOrders: fetch the signed-in customer's order history, newest first.
// -> Promise<Order[]>: empty array when they have never ordered.
export async function getOrders(): Promise<Order[]> {
    // GET /orders/ (Bearer token attached automatically); <Order[]> types the body.
    const { data } = await api.get<Order[]>("/orders/");
    // Return the list as-is.
    return data;
}

// Define getOrder: fetch one order by reference, or null when it doesn't exist (or isn't theirs).
// reference: the human-friendly id from the URL. -> Promise<Order | null>.
export async function getOrder(reference: string): Promise<Order | null> {
    // try: a 404 is a normal answer here, not a failure.
    try {
        // GET /orders/<reference>; <Order> types the body.
        const { data } = await api.get<Order>(`/orders/${reference}`);
        // Found: return the order.
        return data;
        // catch: translate 404 to null, re-throw everything else.
    } catch (error) {
        // 404 specifically: unknown reference OR another customer's order -- both read as "not found".
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        // Network/500: re-throw so the page shows its error + retry UI.
        throw error;
    }
}
