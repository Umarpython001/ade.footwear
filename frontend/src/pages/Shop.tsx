import { Link, useSearchParams } from "react-router";
import { ErrorState, MessageState, PageHeader, PlaceholderNote, ProductGridSkeleton } from "../components/PageStates";
import { ProductCard } from "../components/ProductCard";
import { Reveal } from "../components/Reveal";
import { stagger } from "../hooks/useReveal";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useResource";
import type { Category } from "../types/product";

const CATEGORIES: Category[] = ["Shoes", "Sandals", "Slippers"];

function FilterChip({ to, label, active }: { to: string; label: string; active: boolean }) {
    return (
        <Link
            to={to}
            aria-current={active ? "true" : undefined}
            className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                active ? "border-gold bg-gold text-ink" : "border-seam text-bone hover:border-bone"
            }`}
        >
            {label}
        </Link>
    );
}

export function ShopPage() {
    useDocumentTitle("Shop");
    const [params] = useSearchParams();
    const requested = params.get("category");
    const category = CATEGORIES.find((c) => c === requested) ?? null;
    const products = useProducts();

    const visible =
        products.status === "success"
            ? products.data.filter((product) => !category || product.category === category)
            : [];

    return (
        <div className="wrap">
            <PageHeader title="Shop">
                Handcrafted leather shoes, sandals and slippers.
                <div className="mt-3">
                    <PlaceholderNote>Demo catalogue: names, prices and sizes are dummy data.</PlaceholderNote>
                </div>
            </PageHeader>

            <nav aria-label="Filter by category" className="mt-10">
                <ul className="flex flex-wrap gap-2">
                    <li>
                        <FilterChip to="/shop" label="All" active={!category} />
                    </li>
                    {CATEGORIES.map((c) => (
                        <li key={c}>
                            <FilterChip to={`/shop?category=${c}`} label={c} active={category === c} />
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-10">
                {products.status === "loading" && <ProductGridSkeleton count={8} />}
                {products.status === "error" && <ErrorState onRetry={products.retry} />}
                {products.status === "success" && (
                    <>
                        <p className="mb-6 text-sm text-sand" aria-live="polite">
                            {visible.length} {visible.length === 1 ? "product" : "products"}
                        </p>
                        {visible.length === 0 ? (
                            <MessageState
                                title={`No ${category?.toLowerCase() ?? "products"} right now`}
                                action={
                                    <Link to="/shop" className="btn-primary">
                                        See all products
                                    </Link>
                                }
                            >
                                New pairs are added often. Check back soon or browse the full collection.
                            </MessageState>
                        ) : (
                            <ul key={category ?? "all"} className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                                {visible.map((product, index) => (
                                    <Reveal as="li" key={product.id} delay={stagger(index)}>
                                        <ProductCard product={product} eager={index < 4} />
                                    </Reveal>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
