import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import type { Dispatch, ReactNode } from "react";
import { isAxiosError } from "axios";

// Import useAuth: session state; syncing only runs while signed in.
import { useAuth } from "./Auth";
// Import fetchRemoteCart: GET /cart (pull on sign-in).
import { fetchRemoteCart } from "../services/cart";
// Import replaceRemoteCart: PUT /cart (push local changes + upload the guest cart).
import { replaceRemoteCart } from "../services/cart";

// Only identifiers and quantities live in the cart. Prices and product
// details are looked up from current product data when totals are shown.
export interface CartItem {
    productId: string;
    size: string;
    quantity: number;
}

export type CartAction =
    | { type: "add"; productId: string; size: string; quantity?: number }
    | { type: "remove"; productId: string; size: string }
    | { type: "setQuantity"; productId: string; size: string; quantity: number }
    | { type: "replace"; items: CartItem[] }
    | { type: "clear" };

// SyncStatus: where the cart lives right now.
// local: signed out (or pull failed) -- localStorage is the cart.
// syncing: talking to the server (pull on sign-in, or pushing a change).
// synced: server and local agree. error: last server call failed; local still works.
export type SyncStatus = "local" | "syncing" | "synced" | "error";

const STORAGE_KEY = "ade-cart";

// PUSH_DELAY_MS: wait this long after the last cart change before pushing,
// so rapid taps (quantity + +) send one PUT, not three.
const PUSH_DELAY_MS = 600;

// MAX_QUANTITY: per-line cap, matching the backend's cap.
const MAX_QUANTITY = 99;

const isSameLine = (item: CartItem, productId: string, size: string) =>
    item.productId === productId && item.size === size;

function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
    switch (action.type) {
        case "add": {
            const quantity = action.quantity ?? 1;
            const existing = items.find((item) => isSameLine(item, action.productId, action.size));
            if (existing) {
                return items.map((item) =>
                    item === existing
                        ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
                        : item
                );
            }
            return [...items, { productId: action.productId, size: action.size, quantity }];
        }
        case "remove":
            return items.filter((item) => !isSameLine(item, action.productId, action.size));
        case "setQuantity":
            if (action.quantity <= 0) {
                return items.filter((item) => !isSameLine(item, action.productId, action.size));
            }
            return items.map((item) =>
                isSameLine(item, action.productId, action.size)
                    ? { ...item, quantity: Math.min(action.quantity, MAX_QUANTITY) }
                    : item
            );
        case "replace":
            return action.items;
        case "clear":
            return [];
    }
}

function isCartItem(value: unknown): value is CartItem {
    if (typeof value !== "object" || value === null) return false;
    const item = value as Record<string, unknown>;
    return (
        typeof item.productId === "string" &&
        typeof item.size === "string" &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
}

function loadCart(): CartItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
        return [];
    }
}

// mergeCarts: union of the guest cart and the server cart, summing quantities
// of matching (productId, size) lines and capping at MAX_QUANTITY.
function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
    const merged: CartItem[] = remote.map((item) => ({ ...item }));
    for (const item of local) {
        const existing = merged.find((line) => isSameLine(line, item.productId, item.size));
        if (existing) {
            existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QUANTITY);
        } else {
            merged.push({ ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) });
        }
    }
    return merged;
}

// sameCart: order-insensitive equality check, so we can skip a redundant push
// when the merged cart already equals what the server has.
function sameCart(a: CartItem[], b: CartItem[]): boolean {
    if (a.length !== b.length) return false;
    const key = (item: CartItem) => `${item.productId}::${item.size}::${item.quantity}`;
    const sortedA = a.map(key).sort();
    const sortedB = b.map(key).sort();
    return sortedA.every((value, index) => value === sortedB[index]);
}

interface CartContextValue {
    items: CartItem[];
    dispatch: Dispatch<CartAction>;
    syncStatus: SyncStatus;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, dispatch] = useReducer(cartReducer, undefined, loadCart);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
    const auth = useAuth();
    // userId: the signed-in user's id, or null for guests (no syncing for guests).
    const userId = auth.status === "signed-in" ? auth.user.id : null;

    // itemsRef: always the latest items for use inside async callbacks.
    const itemsRef = useRef(items);
    itemsRef.current = items;
    // pulledFor: which user's cart we already pulled (StrictMode mounts twice; pull once per user).
    const pulledFor = useRef<string | null>(null);
    // pushTimer: the pending debounced push, cleared on every new change.
    const pushTimer = useRef<number | undefined>(undefined);
    // skipPush: set when a replace came from the server path itself, so it isn't echoed back.
    const skipPush = useRef(false);

    // Persist the guest cart + offline cache on every change (signed in or not).
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Storage can be full or blocked; the cart still works for this visit.
        }
    }, [items]);

    // Pull on sign-in: fetch the server cart, merge the guest cart into it,
    // show the merged cart, and push the merged cart up when the guest added anything.
    useEffect(() => {
        // Signed out: reset for the next sign-in; the local cart stays as-is.
        if (!userId) {
            pulledFor.current = null;
            window.clearTimeout(pushTimer.current);
            setSyncStatus("local");
            return;
        }
        // Already pulled for this user (StrictMode double-mount): do nothing.
        if (pulledFor.current === userId) return;
        pulledFor.current = userId;

        let cancelled = false;
        setSyncStatus("syncing");
        (async () => {
            try {
                const remote = await fetchRemoteCart();
                if (cancelled) return;
                const merged = mergeCarts(itemsRef.current, remote);
                if (sameCart(merged, remote) && sameCart(merged, itemsRef.current)) {
                    // Local and server already agree: nothing to show or push.
                    setSyncStatus("synced");
                    return;
                }
                if (sameCart(merged, remote)) {
                    // Local added nothing new: show the server cart without echoing it back.
                    skipPush.current = true;
                    dispatch({ type: "replace", items: merged });
                    setSyncStatus("synced");
                    return;
                }
                // The guest cart had items: show the merged cart; the push effect below
                // uploads it (this dispatch is NOT skipped, deliberately).
                dispatch({ type: "replace", items: merged });
                setSyncStatus("syncing");
            } catch (error) {
                // Offline or 401: keep the local cart working; retry on the next change.
                // A 401 here means the token didn't verify; AuthProvider owns the session itself.
                if (!isAxiosError(error) || error.response?.status !== 401) {
                    if (!cancelled) setSyncStatus("error");
                } else if (!cancelled) {
                    setSyncStatus("local");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
        // userId only: the pull runs once per sign-in; items come via itemsRef.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Push while signed in: debounced PUT of the whole cart after every change
    // (add, remove, quantity, clear -- including checkout's clear after success).
    useEffect(() => {
        // Guests never push; and don't push before the sign-in pull ran.
        if (!userId || pulledFor.current !== userId) return;
        // This change came from the server path itself: consume the flag, don't echo.
        if (skipPush.current) {
            skipPush.current = false;
            return;
        }
        setSyncStatus("syncing");
        window.clearTimeout(pushTimer.current);
        pushTimer.current = window.setTimeout(() => {
            (async () => {
                try {
                    await replaceRemoteCart(itemsRef.current);
                    setSyncStatus("synced");
                } catch {
                    // Offline/server down: localStorage already has the cart; retry on next change.
                    setSyncStatus("error");
                }
            })();
        }, PUSH_DELAY_MS);
        return () => window.clearTimeout(pushTimer.current);
        // items + userId: every cart change for the current user schedules a push.
    }, [items, userId]);

    return <CartContext value={{ items, dispatch, syncStatus }}>{children}</CartContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }
    return context;
}
