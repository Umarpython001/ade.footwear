import { isAxiosError } from "axios";
import { api } from "../lib/api";
import type { Category, Product, ProductImage, ProductSize } from "../types/product";

// Talks to the FastAPI backend: GET /products and GET /products/{slug}.
// Callers already treat product data as async, so nothing else changes.

// The backend's ProductOut shape (camelCase, no internal columns).
type ApiProduct = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    category: string;
    priceKobo: number;
    images: ProductImage[];
    sizes: ProductSize[];
    featured: boolean;
};

type ApiProductPage = {
    skip: number;
    limit: number;
    data: ApiProduct[];
};

function toProduct(apiProduct: ApiProduct): Product {
    return {
        ...apiProduct,
        description: apiProduct.description ?? "",
        // The backend only serves active products, so a product is "available"
        // in the UI as long as at least one size can be ordered. A fully
        // sold-out product greys out, matching the old dummy-data behaviour.
        available: apiProduct.sizes.some((size) => size.available),
        // Valid once the catalogue holds real ADE data ("Shoes" | "Sandals" |
        // "Slippers"); the current placeholder seed uses other strings.
        category: apiProduct.category as Category,
    };
}

export async function getProducts(): Promise<Product[]> {
    const { data } = await api.get<ApiProductPage>("/products/", {
        params: { limit: 100 },
    });
    return data.data.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    try {
        const { data } = await api.get<ApiProduct>(`/products/${slug}`);
        return toProduct(data);
    } catch (error) {
        // A missing product is a normal answer, not a failure.
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}
