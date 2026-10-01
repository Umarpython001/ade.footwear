import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { CartIcon } from "../components/Icons";
import { ErrorState, LoadingBlock, MessageState, PlaceholderNote } from "../components/PageStates";
import { QuantityStepper } from "../components/QuantityStepper";
import { useCart } from "../context/Cart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProduct } from "../hooks/useResource";
import { formatNaira } from "../lib/format";
import type { Product } from "../types/product";

function ProductView({ product }: { product: Product }) {
    const { dispatch } = useCart();
    const [imageIndex, setImageIndex] = useState(0);
    const [size, setSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState<{ size: string; quantity: number } | null>(null);
    const [sizeMissing, setSizeMissing] = useState(false);
    const sizesRef = useRef<HTMLFieldSetElement>(null);

    const image = product.images[imageIndex] ?? product.images[0];
    const hasSoldOutSizes = product.sizes.some((s) => !s.available);

    function addToCart() {
        if (!product.available) return;
        if (!size) {
            // Keep the button clickable and explain, rather than a silent disabled state.
            setSizeMissing(true);
            sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
            return;
        }
        dispatch({ type: "add", productId: product.id, size, quantity });
        setAdded({ size, quantity });
    }

    return (
        <>
            <nav aria-label="Breadcrumb" className="text-sm text-sand">
                <ol className="flex flex-wrap gap-2">
                    <li>
                        <Link to="/shop" className="hover:text-bone">
                            Shop
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                        <Link to={`/shop?category=${product.category}`} className="hover:text-bone">
                            {product.category}
                        </Link>
                    </li>
                </ol>
            </nav>

            <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
                <div>
                    <div className="aspect-[4/5] animate-settle overflow-hidden rounded-[2rem] bg-walnut">
                        <img
                            src={image.src}
                            alt={image.alt}
                            fetchPriority="high"
                            style={{ objectPosition: image.focus }}
                            className={`h-full w-full object-cover ${product.available ? "" : "grayscale-[60%]"}`}
                        />
                    </div>
                    {product.images.length > 1 && (
                        <ul className="mt-3 flex gap-3">
                            {product.images.map((img, index) => (
                                <li key={img.src}>
                                    <button
                                        type="button"
                                        onClick={() => setImageIndex(index)}
                                        aria-label={`Show image ${index + 1}`}
                                        aria-pressed={index === imageIndex}
                                        className={`block h-20 w-16 overflow-hidden rounded-md border-2 ${
                                            index === imageIndex ? "border-gold" : "border-transparent"
                                        }`}
                                    >
                                        <img src={img.src} alt="" className="h-full w-full object-cover" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="md:sticky md:top-28 md:self-start md:pt-2">
                    <h1 className="display-lg">{product.name}</h1>
                    <p className="mt-3 text-2xl font-semibold text-gold">{formatNaira(product.priceKobo)}</p>
                    <div className="mt-3">
                        <PlaceholderNote>Dummy name, price, sizes and description.</PlaceholderNote>
                    </div>
                    <p className="mt-6 max-w-prose leading-relaxed text-bone/85">{product.description}</p>

                    {product.available ? (
                        <>
                            <fieldset ref={sizesRef} className="mt-8">
                                <legend className="text-sm font-semibold">Size</legend>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {product.sizes.map((s) => (
                                        <label key={s.size} className="cursor-pointer has-[:disabled]:cursor-not-allowed">
                                            <input
                                                type="radio"
                                                name="size"
                                                value={s.size}
                                                disabled={!s.available}
                                                checked={size === s.size}
                                                onChange={() => {
                                                    setSize(s.size);
                                                    setSizeMissing(false);
                                                    setAdded(null);
                                                }}
                                                className="peer sr-only"
                                            />
                                            <span className="grid h-12 min-w-12 place-items-center rounded-lg border border-seam px-3 font-semibold transition-colors hover:border-bone peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold peer-disabled:border-seam/60 peer-disabled:text-sand/50 peer-disabled:line-through">
                                                {s.size}
                                                {!s.available && <span className="sr-only"> (sold out)</span>}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {hasSoldOutSizes && <p className="mt-3 text-sm text-sand">Crossed-out sizes are sold out.</p>}
                            </fieldset>

                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <QuantityStepper
                                    value={quantity}
                                    onChange={(value) => setQuantity(Math.max(1, value))}
                                    label="Quantity"
                                />
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    className="btn-primary flex-1 sm:min-w-[14rem] sm:flex-none"
                                >
                                    <CartIcon width={18} height={18} /> Add to cart
                                </button>
                            </div>
                            {!size &&
                                (sizeMissing ? (
                                    <p role="alert" className="mt-3 animate-rise text-sm font-semibold text-gold">
                                        Choose a size first, then add to cart.
                                    </p>
                                ) : (
                                    <p className="mt-3 text-sm text-sand">Choose a size to add this pair to your cart.</p>
                                ))}
                        </>
                    ) : (
                        <div className="mt-8 rounded-xl border border-seam bg-coal p-5">
                            <p className="font-semibold">Sold out</p>
                            <p className="mt-1 text-sm text-sand">
                                This style isn't available right now. Ask about restocks on{" "}
                                <a
                                    href="https://www.instagram.com/ade.footwear/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-bone underline underline-offset-4"
                                >
                                    Instagram
                                </a>
                                .
                            </p>
                        </div>
                    )}

                    <div aria-live="polite" className="mt-4 min-h-6">
                        {added && (
                            <p key={`${added.size}-${added.quantity}`} className="flex animate-rise flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                <span>
                                    Added {added.quantity} × size {added.size} to your cart.
                                </span>
                                <Link to="/cart" className="font-semibold text-gold underline underline-offset-4">
                                    View cart
                                </Link>
                            </p>
                        )}
                    </div>

                    <p className="mt-8 border-t border-seam pt-6 text-sm leading-relaxed text-sand">
                        Checkout sends an order request to Ade Foot Wear. No payment is taken on this website.
                    </p>
                </div>
            </div>
        </>
    );
}

export function ProductDetailsPage() {
    const { slug = "" } = useParams();
    const product = useProduct(slug);
    useDocumentTitle(
        product.status === "success" ? (product.data?.name ?? "Product not found") : "Product"
    );

    return (
        <div className="wrap">
            {product.status === "loading" && <LoadingBlock label="Loading product" />}
            {product.status === "error" && <ErrorState onRetry={product.retry} />}
            {product.status === "success" && !product.data && (
                <MessageState
                    title="We couldn't find that product"
                    action={
                        <Link to="/shop" className="btn-primary">
                            Browse the shop
                        </Link>
                    }
                >
                    It may have been renamed or removed from the catalogue.
                </MessageState>
            )}
            {product.status === "success" && product.data && (
                <ProductView key={product.data.id} product={product.data} />
            )}
        </div>
    );
}
