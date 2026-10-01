import { useEffect, useState } from "react";
import { getProductBySlug, getProducts } from "../services/products";
import type { Product } from "../types/product";

export type Resource<T> =
    | { status: "loading" }
    | { status: "error"; retry: () => void }
    | { status: "success"; data: T };

type Settled<T> = { key: string; attempt: number } & ({ ok: true; data: T } | { ok: false });

// Loads async data for a key. The result is tied to the key and attempt it
// was fetched for, so a changed key reads as loading instead of stale data.
function useResource<T>(key: string, fetcher: (key: string) => Promise<T>): Resource<T> {
    const [attempt, setAttempt] = useState(0);
    const [settled, setSettled] = useState<Settled<T> | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetcher(key).then(
            (data) => {
                if (!cancelled) setSettled({ key, attempt, ok: true, data });
            },
            () => {
                if (!cancelled) setSettled({ key, attempt, ok: false });
            }
        );
        return () => {
            cancelled = true;
        };
    }, [key, attempt, fetcher]);

    if (!settled || settled.key !== key || settled.attempt !== attempt) {
        return { status: "loading" };
    }
    if (!settled.ok) {
        return { status: "error", retry: () => setAttempt((n) => n + 1) };
    }
    return { status: "success", data: settled.data };
}

const fetchAllProducts = () => getProducts();

export function useProducts(): Resource<Product[]> {
    return useResource("all", fetchAllProducts);
}

export function useProduct(slug: string): Resource<Product | null> {
    return useResource(slug, getProductBySlug);
}
