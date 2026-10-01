export type Category = "Shoes" | "Sandals" | "Slippers";

export interface ProductImage {
    src: string;
    alt: string;
    // CSS object-position for cropping the portrait source photos.
    focus: string;
}

export interface ProductSize {
    size: string;
    available: boolean;
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: Category;
    // Naira stored as integer kobo, matching the planned database column.
    priceKobo: number;
    images: ProductImage[];
    sizes: ProductSize[];
    available: boolean;
    featured: boolean;
}
