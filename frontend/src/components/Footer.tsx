import { Link } from "react-router";
import logo from "../assets/logo.png";
import { InstagramIcon } from "./Icons";

const INSTAGRAM_URL = "https://www.instagram.com/ade.footwear/";

const EXPLORE = [
    { label: "Home", to: "/" },
    { label: "About", to: "/#about" },
    { label: "Delivery", to: "/#delivery" },
    { label: "Reviews", to: "/#reviews" },
    { label: "Your orders", to: "/orders" },
];

const SHOP = [
    { label: "All products", to: "/shop" },
    { label: "Shoes", to: "/shop?category=Shoes" },
    { label: "Sandals", to: "/shop?category=Sandals" },
    { label: "Slippers", to: "/shop?category=Slippers" },
];

function FooterLinks({ title, links }: { title: string; links: { label: string; to: string }[] }) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-bone">{title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-sand">
                {links.map((link) => (
                    <li key={link.to}>
                        <Link to={link.to} className="transition-colors hover:text-bone">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Footer() {
    return (
        <footer id="contact" className="scroll-mt-24 border-t border-seam bg-coal">
            <div className="mx-auto grid max-w-page gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:px-10">
                <div>
                    <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-md">
                        <img src={logo} alt="Ade Foot Wear" width={150} height={150} className="h-40 w-40 max-w-none" loading="lazy" />
                    </div>
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand">
                        Handcrafted leather footwear, made in Nigeria.
                    </p>
                </div>

                <FooterLinks title="Explore" links={EXPLORE} />
                <FooterLinks title="Shop" links={SHOP} />

                <div>
                    <h2 className="text-sm font-semibold text-bone">Get in touch</h2>
                    <ul className="mt-4 space-y-3 text-sm text-sand">
                        <li>
                            <a href="tel:+2348082475564" className="transition-colors hover:text-bone">
                                0808 247 5564
                            </a>
                        </li>
                        <li>
                            <a href="mailto:adefootwear9@gmail.com" className="break-all transition-colors hover:text-bone">
                                adefootwear9@gmail.com
                            </a>
                        </li>
                        <li>
                            <a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 transition-colors hover:text-bone"
                            >
                                <InstagramIcon width={18} height={18} />
                                @ade.footwear
                            </a>
                        </li>
                    </ul>
                    <p className="mt-4 text-xs text-sand">
                        <span className="placeholder-tag">Placeholder</span> Phone and email taken from packaging;
                        owner to confirm.
                    </p>
                </div>
            </div>
            <p
                aria-hidden="true"
                className="wrap select-none whitespace-nowrap pb-8 font-display font-extrabold leading-none tracking-[-0.04em] text-bark"
                style={{ fontSize: "clamp(3rem, 10.5vw, 6rem)" }}
            >
                Ade Foot Wear
            </p>
            <div className="border-t border-seam">
                <p className="mx-auto max-w-page px-4 py-6 text-xs text-sand sm:px-6 lg:px-10">
                    © {new Date().getFullYear()} Ade Foot Wear
                </p>
            </div>
        </footer>
    );
}
