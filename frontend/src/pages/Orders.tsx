// Import Link: client-side navigation (shop link, per-order confirmation links).
import { Link } from "react-router";
// Import GoogleSignInButton: the sign-in prompt for signed-out visitors (default returnTo "/" = homepage).
import { GoogleSignInButton } from "../components/GoogleSignInButton";
// Import ArrowRightIcon: arrow used in the navigation links.
import { ArrowRightIcon } from "../components/Icons";
// Import PageStates: loading / error / empty scaffolding matching the rest of the site.
import { ErrorState } from "../components/PageStates";
import { LoadingBlock } from "../components/PageStates";
import { MessageState } from "../components/PageStates";
import { PageHeader } from "../components/PageStates";
// Import Reveal: scroll-reveal wrapper used across the homepage sections and cards.
import { Reveal } from "../components/Reveal";
// Import useAuth: session state; history loads only when signed in.
import { useAuth } from "../context/Auth";
// Import useDocumentTitle: sets the browser tab title.
import { useDocumentTitle } from "../hooks/useDocumentTitle";
// Import useResource: async loader with loading/error/success states + retry.
import { useResource } from "../hooks/useResource";
// Import formatNaira: renders integer kobo as Naira text in totals.
import { formatNaira } from "../lib/format";
// Import getOrders: GET /orders (signed-in customer's history, newest first).
import { getOrders } from "../services/orders";
// Import Order type: the shape each history card renders.
import type { Order } from "../services/orders";

// Define formatDate: turn the ISO created_at into a short readable date (e.g. "3 Oct 2026").
// iso: the created_at string from the API. -> string: en-GB day + short month + year.
function formatDate(iso: string): string {
    // Date parses the ISO string; toLocaleDateString renders it in Lagos-friendly day-first order.
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Define OrderCard: one history row linking to its confirmation page.
// order: one order from the history list. index: position, used to stagger the reveal.
function OrderCard({ order, index }: { order: Order; index: number }) {
    // Count total pairs across all lines (e.g. 2x size 42 + 1x size 41 = 3 pairs).
    const pairCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    // Render the card as a link to the full confirmation for this reference.
    return (
        <Reveal delay={index * 60}>
            <Link
                to={`/order-confirmed/${order.reference}`}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-seam bg-coal p-6 transition-colors hover:border-gold"
            >
                {/* Left: reference + date + line summary. */}
                <div className="min-w-0">
                    <p className="font-display text-xl font-bold tracking-tight">{order.reference}</p>
                    <p className="mt-1 text-sm text-sand">
                        {formatDate(order.createdAt)} · {pairCount} {pairCount === 1 ? "pair" : "pairs"} ·{" "}
                        {order.status}
                    </p>
                </div>
                {/* Right: total + arrow. */}
                <div className="flex shrink-0 items-center gap-3">
                    <p className="font-bold">{formatNaira(order.totalKobo)}</p>
                    <ArrowRightIcon />
                </div>
            </Link>
        </Reveal>
    );
}

// Define OrdersList: fetches and renders the history. Rendered ONLY when signed in,
// so the fetch always carries a token and hooks stay unconditional.
// (The parent gates who sees this component.)
function OrdersList() {
    // Load the history; the key "mine" is constant because there is exactly one list per session.
    const orders = useResource<Order[]>("mine", () => getOrders());

    // Still fetching: show the loading block.
    if (orders.status === "loading") return <LoadingBlock label="Loading your orders" />;
    // Network/500 failure: show the error state with a retry button.
    if (orders.status === "error") return <ErrorState onRetry={orders.retry} />;
    // Signed in but never ordered: empty state pointing at the shop.
    if (orders.data.length === 0) {
        return (
            <MessageState
                title="No orders yet"
                action={
                    <Link to="/shop" className="btn-primary">
                        Browse the shop <ArrowRightIcon />
                    </Link>
                }
            >
                When you send your first order request, it will appear here with its reference and status.
            </MessageState>
        );
    }

    // Non-empty history: one card per order, newest first (backend order).
    return (
        <div className="mt-10 space-y-4">
            {orders.data.map((order, index) => (
                <OrderCard key={order.reference} order={order} index={index} />
            ))}
        </div>
    );
}

// Define OrdersPage: route /orders; sign-in prompt when signed out, real history when signed in.
export function OrdersPage() {
    // Tab title for the orders page.
    useDocumentTitle("Your orders");
    // Session state: decides between the sign-in card and the history list.
    const auth = useAuth();

    // Render the page shell with the header and the session-dependent body.
    return (
        <div className="wrap">
            <PageHeader title="Your orders">Every order request you send to Ade Foot Wear, in one place.</PageHeader>

            <div className="mt-10">
                {/* Loading: session not read yet -- wait before choosing a branch. */}
                {auth.status === "loading" && <LoadingBlock label="Loading" />}
                {/* Signed out: the sign-in card (button returns to the homepage after Google, per the rule). */}
                {auth.status === "signed-out" && (
                    <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                        <Reveal className="rounded-[2rem] border border-seam bg-coal p-8 sm:p-12">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sign in to see your orders</h2>
                            <p className="mt-4 max-w-md leading-relaxed text-sand">
                                Use your Google account. There's no password to create, and your cart stays saved on this device.
                            </p>
                            <GoogleSignInButton className="mt-8" />
                            <Link to="/shop" className="link-arrow mt-6">
                                Keep browsing <ArrowRightIcon />
                            </Link>
                        </Reveal>

                        <Reveal delay={120} className="rounded-[2rem] bg-walnut p-8 sm:p-12">
                            <h2 className="text-xl font-semibold">Once you're signed in</h2>
                            <ul className="mt-6 divide-y divide-bone/15">
                                <li className="py-5 first:pt-0 last:pb-0">
                                    <p className="font-display text-lg font-semibold">Every order request</p>
                                    <p className="mt-1 text-sm leading-relaxed text-bone/75">
                                        Each order you send, with its reference and the date you placed it.
                                    </p>
                                </li>
                                <li className="py-5 first:pt-0 last:pb-0">
                                    <p className="font-display text-lg font-semibold">Pairs, sizes and totals</p>
                                    <p className="mt-1 text-sm leading-relaxed text-bone/75">
                                        What you ordered, in which sizes, and the confirmed total.
                                    </p>
                                </li>
                                <li className="py-5 first:pt-0 last:pb-0">
                                    <p className="font-display text-lg font-semibold">Where it stands</p>
                                    <p className="mt-1 text-sm leading-relaxed text-bone/75">
                                        Its status, from submitted to on its way.
                                    </p>
                                </li>
                            </ul>
                        </Reveal>
                    </div>
                )}
                {/* Signed in: short identity line + the live history list. */}
                {auth.status === "signed-in" && (
                    <>
                        <p className="text-sm leading-relaxed text-sand">
                            Signed in as {auth.user.name} · {auth.user.email}
                        </p>
                        <OrdersList />
                    </>
                )}
            </div>
        </div>
    );
}
