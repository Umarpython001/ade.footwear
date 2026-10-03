import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import logo from "../assets/logo.png";
import { useCart } from "../context/Cart";
import { useAuth } from "../context/Auth";
import { signOut } from "../services/auth";
import { useScrolled } from "../hooks/useScrolled";
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from "./Icons";

const LINKS = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "About", to: "/#about" },
    { label: "Delivery", to: "/#delivery" },
    { label: "Reviews", to: "/#reviews" },
    { label: "Contact", to: "/#contact" },
];

function isActive(to: string, pathname: string, hash: string) {
    const [path, fragment] = to.split("#");
    if (fragment) return pathname === "/" && hash === `#${fragment}`;
    if (path === "/") return pathname === "/" && !hash;
    return pathname.startsWith(path) || (path === "/shop" && pathname.startsWith("/products"));
}

export function Navbar() {
    const { pathname, hash } = useLocation();
    const scrolled = useScrolled();
    const [menuOpen, setMenuOpen] = useState(false);
    const { items } = useCart();
    const auth = useAuth();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Transparent only while resting over the homepage hero.
    const transparent = pathname === "/" && !scrolled && !menuOpen;

    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="fixed inset-x-0 top-0 z-50">
            <div
                aria-hidden="true"
                className={`absolute inset-0 border-b border-seam bg-ink transition-opacity duration-500 ease-out ${
                    transparent ? "opacity-0" : "opacity-100"
                }`}
            />
            <div className="relative mx-auto flex h-20 max-w-page items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
                <Link
                    to="/"
                    onClick={closeMenu}
                    className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md"
                >
                    {/* The source logo has wide padding; crop to the lettering. */}
                    <img
                        src={logo}
                        alt="Ade Foot Wear home"
                        width={150}
                        height={150}
                        className="h-[7.5rem] w-[7.5rem] max-w-none"
                    />
                </Link>

                <nav aria-label="Main" className="hidden lg:block">
                    <ul className="flex items-center gap-9 text-[0.95rem]">
                        {LINKS.map((link) => {
                            const active = isActive(link.to, pathname, hash);
                            return (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        aria-current={active ? "page" : undefined}
                                        className={`border-b-2 pb-1 transition-colors duration-200 ${
                                            active
                                                ? "border-gold text-bone"
                                                : "border-transparent text-bone/75 hover:text-bone"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-1">
                    {auth.status === "signed-in" && (
                        <button
                            type="button"
                            onClick={() => void signOut()}
                            className="rounded-full px-3 py-2 text-sm text-bone/85 transition-colors hover:text-bone"
                        >
                            Sign out
                        </button>
                    )}
                    <Link
                        to="/orders"
                        onClick={closeMenu}
                        aria-label="Your orders"
                        className="grid h-11 w-11 place-items-center rounded-full text-bone/85 transition-colors hover:text-bone"
                    >
                        <UserIcon />
                    </Link>
                    <Link
                        to="/cart"
                        onClick={closeMenu}
                        aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                        className="relative grid h-11 w-11 place-items-center rounded-full text-bone/85 transition-colors hover:text-bone"
                    >
                        <CartIcon />
                        {cartCount > 0 && (
                            <span
                                key={cartCount}
                                className="absolute right-0.5 top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-ink"
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        className="grid h-11 w-11 place-items-center rounded-full text-bone lg:hidden"
                    >
                        {menuOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <nav
                    id="mobile-menu"
                    aria-label="Main"
                    className="relative h-[calc(100svh-5rem)] overflow-y-auto border-b border-seam bg-ink px-4 pb-8 pt-2 sm:px-6 lg:hidden"
                >
                    <ul className="flex flex-col">
                        {LINKS.map((link, index) => {
                            const active = isActive(link.to, pathname, hash);
                            return (
                                <li
                                    key={link.to}
                                    className="animate-menu-in border-t border-seam/60 first:border-t-0"
                                    style={{ animationDelay: `${index * 45}ms` }}
                                >
                                    <Link
                                        to={link.to}
                                        onClick={closeMenu}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center justify-between py-5 font-display text-4xl font-bold tracking-tight ${
                                            active ? "text-gold" : "text-bone"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                        {auth.status === "signed-in" && (
                            <li className="border-t border-seam/60">
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMenu();
                                        void signOut();
                                    }}
                                    className="py-5 font-display text-4xl font-bold tracking-tight text-bone/85"
                                >
                                    Sign out
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
            )}
        </header>
    );
}
