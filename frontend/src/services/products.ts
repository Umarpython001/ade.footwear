import { products } from "../data/products";
import type { Product } from "../types/product";

// Stand-in for the FastAPI endpoints GET /products and GET /products/{slug}.
// Only this file changes when the backend is ready; callers already treat
// product data as async.

const NETWORK_DELAY_MS = 350;

const delay = () => new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS));

export async function getProducts(): Promise<Product[]> {
    await delay();
    return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    await delay();
    return products.find((product) => product.slug === slug) ?? null;
}
