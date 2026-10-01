import { Link } from "react-router";
import { formatNaira } from "../lib/format";
import type { Product } from "../types/product";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
    const image = product.images[0];

    return (
        <Link to={`/products/${product.slug}`} className="group block rounded-lg">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-walnut">
                <img
                    src={image.src}
                    alt={image.alt}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    style={{ objectPosition: image.focus }}
                    className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
                        product.available ? "" : "grayscale-[60%]"
                    }`}
                />
                {!product.available && (
                    <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-3 py-1 text-xs font-semibold text-bone">
                        Sold out
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-base font-semibold leading-snug transition-colors group-hover:text-gold sm:text-lg">
                        {product.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-sand">{product.category}</p>
                </div>
                <p className="shrink-0 pt-0.5 font-semibold text-gold">{formatNaira(product.priceKobo)}</p>
            </div>
        </Link>
    );
}
