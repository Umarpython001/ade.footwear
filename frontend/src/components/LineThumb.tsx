import type { Product } from "../types/product";

export function LineThumb({ product }: { product: Product | null }) {
    const image = product?.images[0];
    return (
        <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-walnut sm:w-24">
            {image && (
                <img
                    src={image.src}
                    alt=""
                    loading="lazy"
                    style={{ objectPosition: image.focus }}
                    className="h-full w-full object-cover"
                />
            )}
        </div>
    );
}
