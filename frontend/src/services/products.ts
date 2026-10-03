// Import isAxiosError: type guard distinguishing HTTP failures from network/coding failures.
import { isAxiosError } from "axios";
// Import api: the shared axios instance (baseURL + auth header come from lib/api).
import { api } from "../lib/api";
// Import the frontend's Product types: toProduct below must satisfy these exactly.
import type { Category } from "../types/product";
import type { Product } from "../types/product";
import type { ProductImage } from "../types/product";
import type { ProductSize } from "../types/product";

// Comment: talks to the FastAPI backend: GET /products and GET /products/{slug}.
// Comment: callers already treat product data as async, so nothing else changes.

// Comment: the backend's ProductOut shape (camelCase, no internal columns).
// Define ApiProduct: the raw JSON shape the backend sends for one product.
type ApiProduct = {
    // id: products-table key (e.g. "p-001").
    id: string;
    // slug: URL id (e.g. "woven-buckle-derby").
    slug: string;
    // name: display name.
    name: string;
    // description: long text, or null when the DB column is NULL (toProduct maps it to "").
    description: string | null;
    // category: raw string; cast to Category in toProduct (backend has no such constraint).
    category: string;
    // priceKobo: camelCase wire name for price_kobo (integer kobo).
    priceKobo: number;
    // images: photo list, already shaped as the frontend expects.
    images: ProductImage[];
    // sizes: size list, already shaped as the frontend expects.
    sizes: ProductSize[];
    // featured: homepage-grid flag.
    featured: boolean;
    // NOTE: no `active`/timestamps: the backend never sends internal columns.
};

// Define ApiProductPage: the GET /products envelope ({skip, limit, data}).
type ApiProductPage = {
    // skip: echoed paging input (how many rows were skipped).
    skip: number;
    // limit: echoed paging input (page size).
    limit: number;
    // data: the page of products in ApiProduct shape.
    data: ApiProduct[];
};

// Define toProduct: convert one backend product into the frontend's Product type.
// apiProduct: one item from the API. -> Product: the shape every component/cart helper expects.
function toProduct(apiProduct: ApiProduct): Product {
    // Spread the API object (all shared fields copy over), then fix the three differences below.
    return {
        ...apiProduct,
        // description: backend null becomes "" so components never render null.
        description: apiProduct.description ?? "",
        // Comment: the backend only serves active products, so a product is "available"
        // Comment: in the UI as long as at least one size can be ordered. A fully
        // Comment: sold-out product greys out, matching the old dummy-data behaviour.
        // available: derived -- true when ANY size has available=true (v-buckle-mules => false).
        available: apiProduct.sizes.some((size) => size.available),
        // Comment: valid once the catalogue holds real ADE data ("Shoes" | "Sandals" |
        // Comment: "Slippers"); the current placeholder seed uses other strings.
        // category: cast the free-form backend string into the frontend's Category union.
        category: apiProduct.category as Category,
    };
}

// Define getProducts: fetch the shop catalogue (up to 100 active products).
// -> Promise<Product[]>: the mapped product list for grids, cart pricing, and counts.
export async function getProducts(): Promise<Product[]> {
    // GET /products/ with limit=100; <ApiProductPage> types the response body.
    // (params serializes to ?limit=100; skip defaults to 0 server-side.)
    const { data } = await api.get<ApiProductPage>("/products/", {
        params: { limit: 100 },
    });
    // Map every API product into a frontend Product.
    return data.data.map(toProduct);
}

// Define getProductBySlug: fetch one product for the details page, or null when missing.
// slug: the {slug} URL segment. -> Promise<Product | null>: the product, or null on 404.
export async function getProductBySlug(slug: string): Promise<Product | null> {
    // try: the request raises on any non-2xx status; we classify below.
    try {
        // GET /products/<slug>; <ApiProduct> types the body.
        const { data } = await api.get<ApiProduct>(`/products/${slug}`);
        // Success: map and return the product.
        return toProduct(data);
    } catch (error) {
        // Comment: a missing product is a normal answer, not a failure.
        // 404 specifically means "no such product": return null so the page shows "not found".
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        // Anything else (network down, 500): re-throw so useResource shows its error + retry UI.
        throw error;
    }
}
