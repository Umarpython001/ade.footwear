import { Link } from "react-router";
import { MessageState, PageHeader } from "../components/PageStates";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function OrdersPage() {
    useDocumentTitle("Your orders");

    return (
        <div className="wrap">
            <PageHeader title="Your orders">Every order request you send to Ade Foot Wear, in one place.</PageHeader>
            <div className="mt-10">
                <MessageState
                    title="Sign in to see your orders"
                    action={
                        <>
                            <button type="button" disabled className="btn-primary">
                                Continue with Google
                            </button>
                            <Link to="/shop" className="btn-ghost">
                                Keep browsing
                            </Link>
                        </>
                    }
                >
                    Sign-in isn't available yet. Once it is, each order you place will appear here with its reference
                    and status.
                </MessageState>
            </div>
        </div>
    );
}
