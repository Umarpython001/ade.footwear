// Import useEffect: auto-sends the stashed order when the customer returns from Google signed in.
import { useEffect } from "react";
// Import useRef: one-shot guard so the auto-send fires once even under StrictMode's double effects.
import { useRef } from "react";
// Import useState: sending flag + backend error messages for the submit card.
import { useState } from "react";
// Import InputHTMLAttributes: type for the Field component's passthrough input props.
import type { InputHTMLAttributes } from "react";
// Import Link: client-side navigation (review-cart and edit-cart links).
import { Link } from "react-router";
// Import useNavigate: programmatic navigation to /order-confirmed/:reference after success.
import { useNavigate } from "react-router";
// Import ArrowRightIcon: arrow used in the navigation links.
import { ArrowRightIcon } from "../components/Icons";
// Import LineThumb: small product thumbnail in the order summary rows.
import { LineThumb } from "../components/LineThumb";
// Import PageStates: loading / error / empty scaffolding matching the rest of the site.
import { ErrorState } from "../components/PageStates";
import { LoadingBlock } from "../components/PageStates";
import { MessageState } from "../components/PageStates";
import { PageHeader } from "../components/PageStates";
// Import useAuth: session state; decides whether submit sends directly or via Google first.
import { useAuth } from "../context/Auth";
// Import useCart: cart items for the payload + dispatch({type:"clear"}) after success.
import { useCart } from "../context/Cart";
// Import useDocumentTitle: sets the browser tab title.
import { useDocumentTitle } from "../hooks/useDocumentTitle";
// Import useProducts: live catalogue for resolving cart lines and totals.
import { useProducts } from "../hooks/useResource";
// Import resolveCartLines: joins cart ids with product data; flags sold-out/missing lines.
import { resolveCartLines } from "../lib/cart";
// Import formatNaira: renders integer kobo as Naira text in the summary.
import { formatNaira } from "../lib/format";
// Import isAxiosError: detects a 401 (signed-out mid-flow) for a tailored message.
import { isAxiosError } from "axios";
// Import createOrder: POST /orders with the Idempotency-Key header.
import { createOrder } from "../services/orders";
// Import OrderSubmitError: carries the backend's per-line rejection messages (400s).
import { OrderSubmitError } from "../services/orders";
// Import signInWithGoogle: starts OAuth; "/checkout" brings the customer back here to auto-send.
// (Checkout no longer uses the GoogleSignInButton component: the submit button owns the flow.)
import { signInWithGoogle } from "../services/auth";
// Import CheckoutPayload: the POST body type built from the form + cart.
import type { CheckoutPayload } from "../services/orders";

// PENDING_KEY: sessionStorage slot for the stashed checkout when sign-in interrupts submit.
// sessionStorage (not localStorage): the stash lives exactly one tab session, then vanishes.
const PENDING_KEY = "ade-pending-order";

// Define FieldProps: label + hint plus all native input attributes (required, autoComplete, ...).
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    // id: doubles as the input's name (FormData key) and the label's htmlFor.
    id: string;
    // label: visible field label.
    label: string;
    // hint: optional helper text under the input.
    hint?: string;
}

// Define Field: labelled input block used by the details/delivery fieldsets.
function Field({ id, label, hint, className = "", ...inputProps }: FieldProps) {
    // Render the label + input + optional hint; {...inputProps} forwards required/type/etc.
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

// Read one required text field from the submitted form; trims whitespace.
function field(form: FormData, name: string): string {
    return (form.get(name) as string | null)?.trim() ?? "";
}

// Define CheckoutForm: the order form + summary. Rendered only when the cart is non-empty.
function CheckoutForm() {
    // items: cart lines ({productId, size, quantity}); dispatch: for clearing the cart after success.
    const { items, dispatch } = useCart();
    // products: live catalogue resource (loading/error/success) for resolving lines.
    const products = useProducts();
    // auth: session state (loading/signed-out/signed-in).
    const auth = useAuth();
    // navigate: go to /order-confirmed/:reference on success.
    const navigate = useNavigate();
    // sending: disables the button and shows "Sending…" while the POST is in flight.
    const [sending, setSending] = useState(false);
    // errors: messages shown above the submit button (backend rejections or network failures).
    const [errors, setErrors] = useState<string[]>([]);
    // submitOnce: one-shot guard for the post-Google auto-send (StrictMode runs effects twice in dev).
    const submitOnce = useRef(false);

    // Define sendOrder: POST the payload and handle every outcome in one place.
    // payload: cart + customer + confirmed. key: the idempotency key for this attempt.
    async function sendOrder(payload: CheckoutPayload, key: string) {
        // Show the sending state and clear any previous errors.
        setSending(true);
        setErrors([]);
        // try: the POST either creates (201), replays (200), or rejects (400/401/network).
        try {
            // POST /orders with the key; the backend prices everything from the database.
            const created = await createOrder(payload, key);
            // Success: the order is saved, so the cart is cleared ONLY now (never before).
            dispatch({ type: "clear" });
            // Go to the confirmation page for the new order.
            navigate(`/order-confirmed/${created.reference}`);
            // catch: translate failures into messages the customer can act on.
        } catch (error) {
            // OrderSubmitError (400): cart problems -- show the backend's per-line messages.
            if (error instanceof OrderSubmitError) {
                setErrors(error.lines);
                // 401: the session died mid-flow (expired token) -- ask them to sign in again.
            } else if (isAxiosError(error) && error.response?.status === 401) {
                setErrors(["Your sign-in expired. Please sign in again and resend your order."]);
                // Anything else (network down, 500): generic message, cart untouched so they can retry.
            } else {
                setErrors(["Something went wrong sending your order. Your cart is saved — please try again."]);
            }
            // finally: always leave the sending state, success or failure.
        } finally {
            setSending(false);
        }
    }

    // Auto-send: when the customer returns from Google with a stashed order, send it once.
    // Runs when auth.status changes; the ref + stash removal make it strictly one-shot.
    useEffect(() => {
        // Only signed-in customers can send; otherwise wait (or stay waiting if they cancelled Google).
        if (auth.status !== "signed-in") return;
        // Read the stash; absent means "normal visit, nothing to auto-send".
        const raw = sessionStorage.getItem(PENDING_KEY);
        // No stash or already fired: do nothing.
        if (!raw || submitOnce.current) return;
        // Claim the one shot BEFORE the async work (StrictMode double-effect safety).
        submitOnce.current = true;
        // Parse the stashed {payload, key} and delete the stash so refreshes never resend.
        const { payload, key } = JSON.parse(raw) as { payload: CheckoutPayload; key: string };
        sessionStorage.removeItem(PENDING_KEY);
        // Fire the saved order (errors land in the card via sendOrder's catch paths).
        void sendOrder(payload, key);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sendOrder is stable enough; re-running on it would risk double sends.
    }, [auth.status]);

    // Catalogue still loading / failed: same gates as before (order needs product data).
    if (products.status === "loading") return <LoadingBlock label="Loading your order" />;
    if (products.status === "error") return <ErrorState onRetry={products.retry} />;

    // Resolve cart lines against live data (totals shown, issues flagged).
    const { lines, subtotalKobo, hasIssues } = resolveCartLines(items, products.data);

    // Sold-out or vanished items: send them back to the cart instead of failing at POST time.
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

    // Define handleSubmit: the form's single submit path for BOTH signed-in and signed-out customers.
    // Native validation (required fields + checkbox) runs before this fires.
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        // Stop the native page-reload submit; we send via axios instead.
        event.preventDefault();
        // Don't double-fire while a send is already in flight.
        if (sending) return;
        // Read the form fields into a FormData snapshot.
        const form = new FormData(event.currentTarget);
        // Build the POST body: cart lines from the cart, customer block from the form, confirmed always true
        // (the required checkbox guarantees it was ticked; the backend re-checks with Literal[True]).
        const payload: CheckoutPayload = {
            items: items.map((item) => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
            })),
            customer: {
                name: field(form, "name"),
                email: field(form, "email"),
                phone: field(form, "phone"),
                address: field(form, "address"),
                cityState: field(form, "city"),
                note: field(form, "note") || null,
            },
            confirmed: true,
        };
        // Signed in: fresh key per attempt, send immediately.
        if (auth.status === "signed-in") {
            await sendOrder(payload, crypto.randomUUID());
            return;
        }
        // Signed out: stash payload + key, then start Google sign-in back to /checkout...
        // ...where the auto-send effect above picks the stash up and sends it.
        const key = crypto.randomUUID();
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ payload, key }));
        await signInWithGoogle("/checkout");
        // Note: on success the browser leaves for Google; nothing after this line runs meaningfully.
    }

    // Render the form (details + delivery + confirm checkbox + submit card) beside the summary.
    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
            {/* onSubmit owns the whole flow; aria-describedby points at the status line for screen readers. */}
            <form onSubmit={(event) => void handleSubmit(event)} aria-describedby="checkout-status" className="space-y-10">
                <p id="checkout-status" className="text-sm leading-relaxed text-sand">
                    Fill in your details, then send your order request. Your cart stays saved on this device.
                </p>

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

                <div className="rounded-[1.5rem] border border-seam bg-coal p-6">
                    {/* Backend rejection messages (sold out since the page loaded, etc.) appear here. */}
                    {errors.length > 0 && (
                        <div role="alert" className="mb-5 rounded-xl border border-red-900 bg-red-950/40 p-4">
                            <p className="font-semibold">Your order needs attention</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-sand">
                                {errors.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* Signed in: show identity + the direct send button. */}
                    {auth.status === "signed-in" ? (
                        <>
                            <p className="font-display text-xl font-semibold">Send your order request</p>
                            <p className="mt-1 text-sm leading-relaxed text-sand">
                                Ordering as {auth.user.name} · {auth.user.email}. No payment is taken on
                                this website.
                            </p>
                            <button
                                type="submit"
                                disabled={sending}
                                aria-busy={sending}
                                className="btn-primary mt-5 w-full sm:w-auto"
                            >
                                {sending ? "Sending…" : "Send order request"}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="font-display text-xl font-semibold">Sign in to send your order</p>
                            <p className="mt-1 text-sm leading-relaxed text-sand">
                                We use your Google account to save your order and show it under Your orders. After
                                signing in you return here and your order sends automatically. No payment is taken on
                                this website.
                            </p>
                            <button
                                type="submit"
                                disabled={sending}
                                aria-busy={sending}
                                className="btn-primary mt-5 w-full sm:w-auto"
                            >
                                {sending ? "Sending…" : "Continue with Google to send your order"}
                            </button>
                        </>
                    )}
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

// Define CheckoutPage: route /checkout; shows the form, or an empty-cart message.
export function CheckoutPage() {
    // Tab title for the checkout page.
    useDocumentTitle("Checkout");
    // items: only the length matters here (empty cart => message instead of the form).
    const { items } = useCart();

    // Render the page shell with the header and either the empty state or the form.
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
