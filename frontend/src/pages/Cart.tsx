import { Link } from "react-router";
import { ArrowRightIcon } from "../components/Icons";
import { LineThumb } from "../components/LineThumb";
import { ErrorState, MessageState, PageHeader } from "../components/PageStates";
import { QuantityStepper } from "../components/QuantityStepper";
import { Reveal } from "../components/Reveal";
import { stagger } from "../hooks/useReveal";
import { useCart } from "../context/Cart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useResource";
import { issueMessage, resolveCartLines } from "../lib/cart";
import { formatNaira } from "../lib/format";

function CartLines() {
    const { items, dispatch } = useCart();
    const products = useProducts();

    if (products.status === "loading") {
        return (
            <div role="status" aria-label="Loading your cart" className="animate-pulse space-y-4">
                {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="h-32 rounded-xl bg-bark" />
                ))}
            </div>
        );
    }
    if (products.status === "error") return <ErrorState onRetry={products.retry} />;

    const { lines, subtotalKobo, hasIssues } = resolveCartLines(items, products.data);

    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
            <ul className="divide-y divide-seam border-y border-seam">
                {lines.map(({ item, product, issue, lineTotalKobo }, index) => {
                    const name = product?.name ?? "Unavailable product";
                    return (
                        <Reveal as="li" key={`${item.productId}-${item.size}`} delay={stagger(index)} className="flex gap-4 py-6 sm:gap-6">
                            <LineThumb product={product} />
                            <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                                    <div>
                                        <h2 className="font-display text-lg font-semibold">
                                            {product ? (
                                                <Link to={`/products/${product.slug}`} className="hover:text-gold">
                                                    {name}
                                                </Link>
                                            ) : (
                                                name
                                            )}
                                        </h2>
                                        <p className="mt-0.5 text-sm text-sand">
                                            Size {item.size}
                                            {product && ` · ${formatNaira(product.priceKobo)} each`}
                                        </p>
                                    </div>
                                    {!issue && <p className="font-semibold">{formatNaira(lineTotalKobo)}</p>}
                                </div>

                                {issue && (
                                    <p className="rounded-lg bg-walnut/70 px-3 py-2 text-sm text-bone">
                                        <span className="font-semibold text-gold">Needs attention: </span>
                                        {issueMessage(issue, item.size)}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {issue ? (
                                        <span />
                                    ) : (
                                        <QuantityStepper
                                            value={item.quantity}
                                            onChange={(quantity) =>
                                                dispatch({
                                                    type: "setQuantity",
                                                    productId: item.productId,
                                                    size: item.size,
                                                    quantity: Math.max(1, quantity),
                                                })
                                            }
                                            label={`Quantity for ${name}, size ${item.size}`}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: "remove", productId: item.productId, size: item.size })}
                                        className="text-sm text-sand underline underline-offset-4 transition-colors hover:text-bone"
                                    >
                                        Remove<span className="sr-only"> {name}, size {item.size}</span>
                                    </button>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </ul>

            <aside aria-labelledby="summary-title" className="h-fit rounded-xl border border-seam bg-coal p-6 lg:sticky lg:top-28">
                <h2 id="summary-title" className="text-xl font-semibold">
                    Order summary
                </h2>
                <dl className="mt-6 flex items-baseline justify-between gap-4">
                    <dt className="text-sand">Subtotal</dt>
                    <dd className="text-xl font-semibold">{formatNaira(subtotalKobo)}</dd>
                </dl>
                <p className="mt-4 text-sm leading-relaxed text-sand">
                    Delivery fee and final details are confirmed by Ade Foot Wear after you send your order request. No
                    payment is taken on this website.
                </p>
                {hasIssues ? (
                    <>
                        <button type="button" disabled className="btn-primary mt-6 w-full">
                            Checkout
                        </button>
                        <p className="mt-3 text-sm text-bone">Fix the items marked “Needs attention” to continue.</p>
                    </>
                ) : (
                    <Link to="/checkout" className="btn-primary mt-6 w-full">
                        Checkout <ArrowRightIcon />
                    </Link>
                )}
                <Link to="/shop" className="btn-ghost mt-3 w-full">
                    Continue shopping
                </Link>
            </aside>
        </div>
    );
}

export function CartPage() {
    useDocumentTitle("Cart");
    const { items } = useCart();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="wrap">
            <PageHeader title="Your cart">
                {count > 0 ? `${count} ${count === 1 ? "item" : "items"}, saved on this device.` : null}
            </PageHeader>
            <div className="mt-10">
                {items.length === 0 ? (
                    <MessageState
                        title="Your cart is empty"
                        action={
                            <Link to="/shop" className="btn-primary">
                                Browse the shop <ArrowRightIcon />
                            </Link>
                        }
                    >
                        Pick a pair and a size, and it will wait here for you.
                    </MessageState>
                ) : (
                    <CartLines />
                )}
            </div>
        </div>
    );
}
