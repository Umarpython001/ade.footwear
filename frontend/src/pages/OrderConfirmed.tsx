// Import Link: client-side navigation to shop/orders without a page reload.
import { Link } from "react-router";
// Import useParams: reads the :reference segment from the URL.
import { useParams } from "react-router";
// Import GoogleSignInButton: shown when the visitor isn't signed in yet (returnTo brings them back here).
import { GoogleSignInButton } from "../components/GoogleSignInButton";
// Import PageStates: loading / error / empty page scaffolding matching the rest of the site.
import { ErrorState } from "../components/PageStates";
import { LoadingBlock } from "../components/PageStates";
import { MessageState } from "../components/PageStates";
import { PageHeader } from "../components/PageStates";
// Import LineThumb: the small product thumbnail used in cart/checkout line rows.
import { LineThumb } from "../components/LineThumb";
// Import useAuth: session state; the order can only be fetched when signed in.
import { useAuth } from "../context/Auth";
// Import useDocumentTitle: sets the browser tab title.
import { useDocumentTitle } from "../hooks/useDocumentTitle";
// Import useResource: async loader with loading/error/success states + retry.
import { useResource } from "../hooks/useResource";
// Import formatNaira: renders integer kobo as Naira text (e.g. 5800000 -> N58,000).
import { formatNaira } from "../lib/format";
// Import getOrder: GET /orders/{reference}, null on 404 (unknown ref or someone else's).
import { getOrder } from "../services/orders";
// Import Order type: the shape ConfirmedDetails renders.
import type { Order } from "../services/orders";

// Define ConfirmedDetails: fetches and renders the confirmed order. Rendered ONLY when signed in,
// so hooks stay unconditional (this component always fetches; the parent gates who sees it).
// reference: the order reference from the URL.
function ConfirmedDetails({ reference }: { reference: string }) {
    // Load the order; getOrder maps 404 to null so "not found" is a normal answer, not a crash.
    const order = useResource<Order | null>(reference, getOrder);

    // Still fetching: show the loading block.
    if (order.status === "loading") return <LoadingBlock label="Loading your confirmation" />;
    // Network/500 failure: show the error state with a retry button.
    if (order.status === "error") return <ErrorState onRetry={order.retry} />;
    // Signed in but the reference matches nothing of theirs: explain and link onward.
    if (order.data === null) {
        return (
            <MessageState
                title="Order not found"
                action={
                    <Link to="/orders" className="btn-primary">
                        View your orders
                    </Link>
                }
            >
                We couldn't find that order under your account. It may belong to a different
                signed-in account.
            </MessageState>
        );
    }

    // Narrowed: a real order the caller owns.
    const confirmed = order.data;

    // Render the confirmation: reference, "no payment taken" note, items, and totals.
    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
            {/* Left: what happens next + the ordered items. */}
            <div className="space-y-10">
                {/* Confirmation banner with the reference in large type. */}
                <div className="rounded-[1.5rem] border border-seam bg-coal p-6 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-gold">Order received</p>
                    <p className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                        {confirmed.reference}
                    </p>
                    <p className="mt-3 max-w-md leading-relaxed text-sand">
                        Thank you — your order request is with Ade Foot Wear. No payment was taken on
                        this website; they will confirm delivery with you directly.
                    </p>
                </div>
                {/* Item list: snapshot name/size/qty + line totals (frozen at order time). */}
                <div>
                    <h2 className="font-display text-2xl font-semibold">What you ordered</h2>
                    <ul className="mt-5 space-y-5">
                        {confirmed.items.map((item) => (
                            <li
                                key={`${item.productId}-${item.size}`}
                                className="flex gap-4"
                            >
                                {/* Order snapshots carry no photos, so pass null: LineThumb renders
                                    an empty placeholder box in that case. */}
                                <LineThumb product={null} />
                                <div className="flex min-w-0 flex-1 justify-between gap-3">
                                    <div>
                                        <p className="font-semibold leading-snug">{item.productName}</p>
                                        <p className="mt-0.5 text-sm text-sand">
                                            Size {item.size} · Qty {item.quantity}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold">
                                        {formatNaira(item.lineTotalKobo)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* Right: money summary + onward links. */}
            <aside aria-labelledby="confirmed-summary" className="h-fit rounded-xl border border-seam bg-coal p-6 lg:sticky lg:top-28">
                <h2 id="confirmed-summary" className="text-xl font-semibold">
                    Order summary
                </h2>
                <dl className="mt-6 space-y-3 border-t border-seam pt-5 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-sand">Subtotal</dt>
                        <dd className="font-semibold">{formatNaira(confirmed.subtotalKobo)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-sand">Delivery</dt>
                        <dd className="text-right">Confirmed by Ade Foot Wear</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-seam pt-3 text-base">
                        <dt className="font-semibold">Total</dt>
                        <dd className="font-bold">{formatNaira(confirmed.totalKobo)}</dd>
                    </div>
                </dl>
                <div className="mt-6 flex flex-col gap-3">
                    <Link to="/orders" className="btn-primary text-center">
                        View your orders
                    </Link>
                    <Link to="/shop" className="link-arrow">
                        Keep shopping
                    </Link>
                </div>
            </aside>
        </div>
    );
}

// Define OrderConfirmedPage: route /order-confirmed/:reference, shown after a successful checkout.
export function OrderConfirmedPage() {
    // Tab title for the confirmation page.
    useDocumentTitle("Order confirmed");
    // Session state: gates whether we fetch (signed in) or prompt sign-in.
    const auth = useAuth();
    // reference: the :reference URL segment ("" fallback keeps types happy; route always provides it).
    const { reference } = useParams();
    const safeReference = reference ?? "";

    // Render the page shell; the inner branch depends on session state.
    return (
        <div className="wrap">
            <PageHeader title="Order confirmed">Your order request has been sent.</PageHeader>
            <div className="mt-10">
                {/* Loading: session not read yet -- wait before choosing a branch. */}
                {auth.status === "loading" && <LoadingBlock label="Loading" />}
                {/* Signed out (e.g. opened the link on another device): prompt sign-in, then return HERE. */}
                {auth.status === "signed-out" && (
                    <MessageState
                        title="Sign in to see your confirmation"
                        action={
                            <GoogleSignInButton returnTo={`/order-confirmed/${safeReference}`} />
                        }
                    >
                        Your confirmation lives under the Google account that placed the order.
                    </MessageState>
                )}
                {/* Signed in: fetch and render the confirmation (or not-found). */}
                {auth.status === "signed-in" && <ConfirmedDetails reference={safeReference} />}
            </div>
        </div>
    );
}
