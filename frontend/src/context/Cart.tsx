import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import type { Dispatch, ReactNode } from "react";

// Import useAuth: session state; syncing only runs while signed in.
import { useAuth } from "./Auth";
// Import fetchRemoteCart: GET /cart (pull on sign-in, refetch on focus).
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
// local: signed out (or sync unavailable) -- localStorage is the cart.
// syncing: talking to the server (pull, push, or refetch).
// synced: server and local agree. error: last server call failed; local still works.
export type SyncStatus = "local" | "syncing" | "synced" | "error";

const STORAGE_KEY = "ade-cart";
// SYNCED_KEY: the last cart both sides agreed on, per user. This is what makes
// refresh safe: when local equals this snapshot, local is just a cache of the
// server cart (NOT new guest items), so a pull must adopt the server, not merge.
const SYNCED_KEY = "ade-cart-synced";

// PUSH_DELAY_MS: wait this long after the last cart change before pushing,
// so rapid taps (quantity + +) send one PUT, not three.
const PUSH_DELAY_MS = 600;

// REFETCH_MS: while signed in and the tab is visible, re-read the server cart
// this often so removals/edits from another device appear without a refresh.
const REFETCH_MS = 30_000;

// MAX_QUANTITY: per-line cap, matching the backend's cap.
const MAX_QUANTITY = 99;

const isSameLine = (item: CartItem, productId: string, size: string) =>
    item.productId === productId && item.size === size;

const lineKey = (item: CartItem) => `${item.productId}::${item.size}`;

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

// SyncedSnapshot: the last cart both sides agreed on, plus whose it was.
// userId matters: a snapshot from user A must never be the merge base for user B.
interface SyncedSnapshot {
    userId: string | null;
    items: CartItem[];
}

function loadSynced(): SyncedSnapshot {
    try {
        const stored = localStorage.getItem(SYNCED_KEY);
        if (!stored) return { userId: null, items: [] };
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return { userId: null, items: [] };
        const snapshot = parsed as { userId?: unknown; items?: unknown };
        return {
            userId: typeof snapshot.userId === "string" ? snapshot.userId : null,
            items: Array.isArray(snapshot.items) ? snapshot.items.filter(isCartItem) : [],
        };
    } catch {
        return { userId: null, items: [] };
    }
}

// sameCart: order-insensitive equality check over full lines (id + size + quantity).
function sameCart(a: CartItem[], b: CartItem[]): boolean {
    if (a.length !== b.length) return false;
    const key = (item: CartItem) => `${lineKey(item)}::${item.quantity}`;
    const sortedA = a.map(key).sort();
    const sortedB = b.map(key).sort();
    return sortedA.every((value, index) => value === sortedB[index]);
}

// mergeCarts: three-way merge of local edits onto the server cart.
// local: what this device shows. remote: what the server just returned.
// base: the last snapshot both sides agreed on (the merge base).
// - Lines unchanged locally (same qty as base, or absent from base and local):
//   defer to the server (adopts other-device edits AND other-device removals).
// - Lines added or re-quantitied locally: local wins.
// - Lines in base but missing locally: deleted on this device while offline -> stay deleted.
function mergeCarts(local: CartItem[], remote: CartItem[], base: CartItem[]): CartItem[] {
    const merged = new Map<string, CartItem>();
    for (const item of remote) merged.set(lineKey(item), { ...item });
    const baseByKey = new Map<string, CartItem>();
    for (const item of base) baseByKey.set(lineKey(item), item);

    for (const item of local) {
        const key = lineKey(item);
        const prev = baseByKey.get(key);
        if (prev && prev.quantity === item.quantity) {
            // Untouched on this device: the server version (or its absence) wins.
            continue;
        }
        // Added here, or re-quantitied here while offline: local wins.
        merged.set(key, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) });
    }

    const localKeys = new Set(local.map(lineKey));
    for (const item of base) {
        // In the agreed snapshot but gone locally: deleted on this device -> keep it gone.
        if (!localKeys.has(lineKey(item))) merged.delete(lineKey(item));
    }
    return [...merged.values()];
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
    // syncedRef: the last server-agreed snapshot (mirror of SYNCED_KEY).
    const syncedRef = useRef<SyncedSnapshot>(loadSynced());
    // pulledFor: which user's cart we already pulled (StrictMode mounts twice; pull once per user).
    const pulledFor = useRef<string | null>(null);
    // pushTimer: the pending debounced push, cleared on every new change.
    const pushTimer = useRef<number | undefined>(undefined);
    // pushingRef: a PUT is in flight; refetches wait so they can't overwrite it.
    const pushingRef = useRef(false);

    // baseFor: the merge base for this user (another user's snapshot is not ours).
    const baseFor = (uid: string): CartItem[] =>
        syncedRef.current.userId === uid ? syncedRef.current.items : [];
    // isDirty: local differs from the last agreed snapshot, so the server needs us (or vice versa).
    const isDirty = (uid: string): boolean => !sameCart(itemsRef.current, baseFor(uid));

    const saveSynced = (uid: string, snapshot: CartItem[]) => {
        syncedRef.current = { userId: uid, items: snapshot.map((item) => ({ ...item })) };
        try {
            localStorage.setItem(SYNCED_KEY, JSON.stringify(syncedRef.current));
        } catch {
            // Storage blocked; the in-memory snapshot still guards this session.
        }
    };

    // Persist the guest cart + offline cache on every change (signed in or not).
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Storage can be full or blocked; the cart still works for this visit.
        }
    }, [items]);

    // pushNow: PUT the given lines as the whole server cart. On success the
    // snapshot advances to what was sent; local edits made mid-flight keep us
    // dirty, so the push effect sends them next.
    const pushNow = async (lines: CartItem[], uid: string): Promise<void> => {
        if (pushingRef.current) return;
        // The account changed while debouncing (sign-out, or a different sign-in):
        // never PUT one user's cart under another user's token.
        if (pulledFor.current !== uid) return;
        pushingRef.current = true;
        try {
            await replaceRemoteCart(lines);
            saveSynced(uid, lines);
            setSyncStatus(isDirty(uid) ? "syncing" : "synced");
        } catch {
            // Offline/server down: localStorage already has the cart; the next
            // change or refetch retries.
            setSyncStatus("error");
        } finally {
            pushingRef.current = false;
        }
    };
    // pushNowRef: stable handle for intervals/listeners defined in other effects.
    const pushNowRef = useRef(pushNow);
    pushNowRef.current = pushNow;

    // syncFromServer: reconcile with the server cart.
    // Clean local (just a cache of an older server state, e.g. after refresh):
    // adopt the server cart. Dirty local (guest/offline edits): three-way merge,
    // show it, and upload it so every other device sees it.
    // Stale-run guard: if the user signed out (or into another account) while the
    // fetch was in flight, pulledFor no longer matches, so never touch state.
    const syncFromServer = async (uid: string): Promise<void> => {
        if (pushingRef.current) return;
        setSyncStatus("syncing");
        try {
            const remote = await fetchRemoteCart();
            if (pulledFor.current !== uid) return;
            const local = itemsRef.current;
            const base = baseFor(uid);
            if (sameCart(local, base)) {
                if (!sameCart(local, remote)) dispatch({ type: "replace", items: remote });
                saveSynced(uid, remote);
                setSyncStatus("synced");
                return;
            }
            const merged = mergeCarts(local, remote, base);
            if (!sameCart(merged, local)) dispatch({ type: "replace", items: merged });
            // Upload even when merged equals local: no items change fires then,
            // so the push effect below would never run.
            await pushNowRef.current(merged, uid);
        } catch {
            setSyncStatus("error");
        }
    };
    // syncFromServerRef: stable handle for intervals/listeners.
    const syncFromServerRef = useRef(syncFromServer);
    syncFromServerRef.current = syncFromServer;

    // Pull on sign-in: reconcile once per user; the local cart stays as-is for guests.
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

        // One reconcile per sign-in; cart state flows through refs inside.
        void syncFromServerRef.current(userId);
        // userId only: the pull runs once per sign-in; cart state comes via refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Push while signed in: debounced PUT after every UNSYNCED change
    // (add, remove, quantity, clear -- including checkout's clear after success).
    // Server-adopted replaces leave us clean, so they never echo back.
    useEffect(() => {
        // Guests never push; and don't push before the sign-in pull ran.
        if (!userId || pulledFor.current !== userId) return;
        // Clean (e.g. just adopted the server cart): nothing to send.
        if (!isDirty(userId)) return;
        setSyncStatus("syncing");
        window.clearTimeout(pushTimer.current);
        pushTimer.current = window.setTimeout(() => {
            void pushNowRef.current(itemsRef.current, userId);
        }, PUSH_DELAY_MS);
        return () => window.clearTimeout(pushTimer.current);
        // items + userId: every cart change for the current user schedules a push.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, userId]);

    // Refetch while signed in: on window focus and every REFETCH_MS (visible tab
    // only), so removals/edits from another device appear without a manual refresh.
    // syncFromServer merges when dirty, so in-progress local edits are never lost.
    useEffect(() => {
        if (!userId) return;
        const uid = userId;
        const refetch = () => {
            if (document.hidden) return;
            if (pulledFor.current !== uid) return;
            void syncFromServerRef.current(uid);
        };
        window.addEventListener("focus", refetch);
        document.addEventListener("visibilitychange", refetch);
        const id = window.setInterval(refetch, REFETCH_MS);
        return () => {
            window.removeEventListener("focus", refetch);
            document.removeEventListener("visibilitychange", refetch);
            window.clearInterval(id);
        };
    }, [userId]);

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
