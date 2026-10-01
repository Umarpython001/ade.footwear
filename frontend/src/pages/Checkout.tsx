import type { InputHTMLAttributes } from "react";
import { Link } from "react-router";
import { ArrowRightIcon } from "../components/Icons";
import { LineThumb } from "../components/LineThumb";
import { ErrorState, LoadingBlock, MessageState, PageHeader } from "../components/PageStates";
import { useCart } from "../context/Cart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useResource";
import { resolveCartLines } from "../lib/cart";
import { formatNaira } from "../lib/format";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    hint?: string;
}

function Field({ id, label, hint, className = "", ...inputProps }: FieldProps) {
    return (
        <div className={className}>
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            <input id={id} name={id} className="field mt-2" aria-describedby={hint ? `${id}-hint` : undefined} {...inputProps} />
            {hint && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-sand">
                    {hint}
                </p>
            )}
        </div>
    );
}

function CheckoutForm() {
    const { items } = useCart();
    const products = useProducts();

    if (products.status === "loading") return <LoadingBlock label="Loading your order" />;
    if (products.status === "error") return <ErrorState onRetry={products.retry} />;

    const { lines, subtotalKobo, hasIssues } = resolveCartLines(items, products.data);

    if (hasIssues) {
        return (
            <MessageState
                title="Some items need attention"
                action={
                    <Link to="/cart" className="btn-primary">
                        Review your cart
                    </Link>
                }
            >
                One or more items in your cart are sold out or no longer available. Update your cart to continue.
            </MessageState>
        );
    }

    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
            <form onSubmit={(event) => event.preventDefault()} aria-describedby="checkout-status" className="space-y-10">
                <div id="checkout-status" className="rounded-xl border border-gold/40 bg-walnut/40 p-5">
                    <p className="font-semibold">Ordering opens soon</p>
                    <p className="mt-1 text-sm leading-relaxed text-sand">
                        Sending an order needs sign-in, which isn't ready yet. You can fill in your details to preview
                        checkout. Nothing is sent, and your cart stays saved on this device.
                    </p>
                </div>

                <fieldset>
                    <legend className="font-display text-2xl font-semibold">Your details</legend>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field id="name" label="Full name" autoComplete="name" required className="sm:col-span-2" />
                        <Field id="email" label="Email" type="email" autoComplete="email" required />
                        <Field
                            id="phone"
                            label="Phone or WhatsApp number"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            required
                        />
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="font-display text-2xl font-semibold">Delivery</legend>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field
                            id="address"
                            label="Delivery address"
                            autoComplete="street-address"
                            required
                            className="sm:col-span-2"
                        />
                        <Field id="city" label="City and state" autoComplete="address-level2" required className="sm:col-span-2" />
                        <div className="sm:col-span-2">
                            <label htmlFor="note" className="text-sm font-semibold">
                                Order note <span className="font-normal text-sand">(optional)</span>
                            </label>
                            <textarea id="note" name="note" rows={3} className="field mt-2 resize-y" />
                        </div>
                    </div>
                </fieldset>

                <label className="flex items-start gap-3">
                    <input type="checkbox" name="confirm" required className="mt-0.5 h-5 w-5 shrink-0 accent-gold" />
                    <span className="text-sm leading-relaxed">I confirm these details are correct.</span>
                </label>

                <div>
                    <button type="submit" disabled className="btn-primary w-full sm:w-auto">
                        Send order request
                    </button>
                    <p className="mt-3 text-sm text-sand">Available once sign-in is ready. No payment is taken on this website.</p>
                </div>
            </form>

            <aside aria-labelledby="checkout-summary" className="h-fit rounded-xl border border-seam bg-coal p-6 lg:sticky lg:top-28">
                <h2 id="checkout-summary" className="text-xl font-semibold">
                    Order summary
                </h2>
                <ul className="mt-6 space-y-5">
                    {lines.map(({ item, product, lineTotalKobo }) => (
                        <li key={`${item.productId}-${item.size}`} className="flex gap-4">
                            <LineThumb product={product} />
                            <div className="flex min-w-0 flex-1 justify-between gap-3">
                                <div>
                                    <p className="font-semibold leading-snug">{product?.name}</p>
                                    <p className="mt-0.5 text-sm text-sand">
                                        Size {item.size} · Qty {item.quantity}
                                    </p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold">{formatNaira(lineTotalKobo)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <dl className="mt-6 space-y-3 border-t border-seam pt-5 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-sand">Subtotal</dt>
                        <dd className="font-semibold">{formatNaira(subtotalKobo)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-sand">Delivery</dt>
                        <dd className="text-right">Confirmed by Ade Foot Wear</dd>
                    </div>
                </dl>
                <Link to="/cart" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold underline underline-offset-4">
                    Edit cart <ArrowRightIcon />
                </Link>
            </aside>
        </div>
    );
}

export function CheckoutPage() {
    useDocumentTitle("Checkout");
    const { items } = useCart();

    return (
        <div className="wrap">
            <PageHeader title="Checkout">Review your order and tell us where to deliver it.</PageHeader>
            <div className="mt-10">
                {items.length === 0 ? (
                    <MessageState
                        title="Nothing to check out yet"
                        action={
                            <Link to="/shop" className="btn-primary">
                                Browse the shop <ArrowRightIcon />
                            </Link>
                        }
                    >
                        Your cart is empty. Add a pair to get started.
                    </MessageState>
                ) : (
                    <CheckoutForm />
                )}
            </div>
        </div>
    );
}
