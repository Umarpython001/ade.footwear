import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export function MainLayout() {
    const { pathname } = useLocation();
    // The homepage hero sits under the transparent navbar; other pages clear it.
    const isHome = pathname === "/";

    return (
        <>
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2.5 focus:font-semibold focus:text-ink"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="main" tabIndex={-1} className={isHome ? "outline-none" : "pb-24 pt-28 outline-none sm:pt-32"}>
                {/* Keyed by path so each route arrives with a short fade-up. */}
                <div key={pathname} className="animate-page-in">
                    <Outlet />
                </div>
            </main>
            <Footer />
            <ScrollRestoration />
        </>
    );
}
