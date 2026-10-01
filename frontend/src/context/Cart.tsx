import { createContext, useContext, useEffect, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";

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
    | { type: "clear" };

const STORAGE_KEY = "ade-cart";

const isSameLine = (item: CartItem, productId: string, size: string) =>
    item.productId === productId && item.size === size;

function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
    switch (action.type) {
        case "add": {
            const quantity = action.quantity ?? 1;
            const existing = items.find((item) => isSameLine(item, action.productId, action.size));
            if (existing) {
                return items.map((item) =>
                    item === existing ? { ...item, quantity: item.quantity + quantity } : item
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
                    ? { ...item, quantity: action.quantity }
                    : item
            );
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

interface CartContextValue {
    items: CartItem[];
    dispatch: Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, dispatch] = useReducer(cartReducer, undefined, loadCart);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Storage can be full or blocked; the cart still works for this visit.
        }
    }, [items]);

    return <CartContext value={{ items, dispatch }}>{children}</CartContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }
    return context;
}
