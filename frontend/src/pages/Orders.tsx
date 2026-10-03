import { Link } from "react-router";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { ArrowRightIcon } from "../components/Icons";
import { PageHeader } from "../components/PageStates";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../context/Auth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { stagger } from "../hooks/useReveal";
import { signOut } from "../services/auth";

const WHAT_YOU_SEE = [
    { title: "Every order request", text: "Each order you send, with its reference and the date you placed it." },
    { title: "Pairs, sizes and totals", text: "What you ordered, in which sizes, and the confirmed total." },
    { title: "Where it stands", text: "Its status, from submitted to on its way." },
];

export function OrdersPage() {
    useDocumentTitle("Your orders");
    const auth = useAuth();

    return (
        <div className="wrap">
            <PageHeader title="Your orders">Every order request you send to Ade Foot Wear, in one place.</PageHeader>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <Reveal className="rounded-[2rem] border border-seam bg-coal p-8 sm:p-12">
                    {auth.status === "signed-in" ? (
                        <>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">You're signed in</h2>
                            <p className="mt-4 max-w-md leading-relaxed text-sand">
                                {auth.user.name} · {auth.user.email}
                            </p>
                            <p className="mt-4 max-w-md leading-relaxed text-sand">
                                Your order history will appear here as soon as this page is connected to the backend —
                                that is the next step after sign-in.
                            </p>
                            <button
                                type="button"
                                onClick={() => void signOut()}
                                className="mt-6 text-sm font-semibold text-gold underline underline-offset-4"
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sign in to see your orders</h2>
                            <p className="mt-4 max-w-md leading-relaxed text-sand">
                                Use your Google account. There's no password to create, and your cart stays saved on this
                                device.
                            </p>
                            <GoogleSignInButton className="mt-8" />
                            <Link to="/shop" className="link-arrow mt-6">
                                Keep browsing <ArrowRightIcon />
                            </Link>
                        </>
                    )}
                </Reveal>

                <Reveal delay={120} className="rounded-[2rem] bg-walnut p-8 sm:p-12">
                    <h2 className="text-xl font-semibold">Once you're signed in</h2>
                    <ul className="mt-6 divide-y divide-bone/15">
                        {WHAT_YOU_SEE.map((item, index) => (
                            <Reveal as="li" key={item.title} delay={160 + stagger(index)} className="py-5 first:pt-0 last:pb-0">
                                <p className="font-display text-lg font-semibold">{item.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-bone/75">{item.text}</p>
                            </Reveal>
                        ))}
                    </ul>
                </Reveal>
            </div>
        </div>
    );
}
