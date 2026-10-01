import type { ReactNode } from "react";
import { Link } from "react-router";
import heroImage from "../assets/img4.png";
import { ArrowRightIcon } from "../components/Icons";
import { ErrorState, PlaceholderNote, ProductGridSkeleton } from "../components/PageStates";
import { ProductCard } from "../components/ProductCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useResource";

// Route shell for the homepage. Sections are rebuilt one at a time against
// the mockups in a later phase; the anchors below keep navbar links working.

function SectionStub({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-seam">
            <div className="wrap grid gap-6 py-20 lg:grid-cols-[1fr_1.4fr] lg:py-28">
                <h2 id={`${id}-title`} className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    {title}
                </h2>
                <div className="lg:pt-3">
                    <PlaceholderNote>{children}</PlaceholderNote>
                </div>
            </div>
        </section>
    );
}

export function HomePage() {
    useDocumentTitle();
    const products = useProducts();

    return (
        <>
            <section aria-labelledby="hero-title" className="relative isolate bg-ink lg:grid lg:min-h-[100svh] lg:grid-cols-2">
                <img
                    src={heroImage}
                    alt="Black leather backless mules with silver V hardware and tan insoles on a polished wooden floor"
                    fetchPriority="high"
                    className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_45%] lg:static lg:order-2 lg:h-[calc(100svh-5rem)] lg:mt-20 lg:rounded-bl-[2rem]"
                />
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/60 lg:hidden" />
                <div className="wrap flex min-h-[100svh] flex-col justify-end pb-16 pt-28 lg:mr-0 lg:max-w-[40rem] lg:justify-center lg:pb-20">
                    <h1
                        id="hero-title"
                        className="text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl"
                    >
                        Premium footwear <span className="text-gold">for every move</span>
                    </h1>
                    <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/85">
                        Style. Comfort. Quality. Handcrafted for queens and kings.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link to="/shop" className="btn-primary">
                            Shop now <ArrowRightIcon />
                        </Link>
                        <Link to="/#about" className="btn-ghost">
                            Our story
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="featured-title" className="wrap py-20 lg:py-28">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h2 id="featured-title" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                        Featured pairs
                    </h2>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 border-b border-gold pb-1 text-sm font-semibold text-bone transition-colors hover:text-gold"
                    >
                        View all products <ArrowRightIcon />
                    </Link>
                </div>
                <div className="mt-10">
                    {products.status === "loading" && <ProductGridSkeleton />}
                    {products.status === "error" && <ErrorState onRetry={products.retry} />}
                    {products.status === "success" && (
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                            {products.data
                                .filter((product) => product.featured)
                                .slice(0, 4)
                                .map((product) => (
                                    <li key={product.id}>
                                        <ProductCard product={product} />
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            </section>

            <SectionStub id="about" title="More than just footwear">
                Brand story and workshop photos to come from the owner.
            </SectionStub>
            <SectionStub id="delivery" title="Delivery">
                Delivery areas, fees and timing to be confirmed by the owner.
            </SectionStub>
            <SectionStub id="reviews" title="Reviews">
                Customer reviews will appear here once the owner shares approved ones.
            </SectionStub>
        </>
    );
}
