import { Link } from "react-router";
import { MessageState } from "../components/PageStates";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
    useDocumentTitle("Page not found");

    return (
        <div className="wrap">
            <MessageState
                title="Page not found"
                action={
                    <>
                        <Link to="/shop" className="btn-primary">
                            Go to the shop
                        </Link>
                        <Link to="/" className="btn-ghost">
                            Back to home
                        </Link>
                    </>
                }
            >
                The link may be broken, or the page may have moved.
            </MessageState>
        </div>
    );
}

// Shown when a route throws; rendered outside the layout, so it stays plain.
export function RouteErrorPage() {
    return (
        <main className="wrap grid min-h-[100svh] place-items-center py-24">
            <MessageState
                title="Something went wrong"
                action={
                    <a href="/" className="btn-primary">
                        Reload the site
                    </a>
                }
            >
                Please reload the page. Your cart is saved on this device.
            </MessageState>
        </main>
    );
}
