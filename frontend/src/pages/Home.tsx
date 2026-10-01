import { useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { HeroSlideshow } from "../components/HeroSlideshow";
import {
    ArrowRightIcon,
    ChatIcon,
    HideIcon,
    InstagramIcon,
    NeedleIcon,
    PinIcon,
    ShieldIcon,
} from "../components/Icons";
import { ErrorState, PlaceholderNote, ProductGridSkeleton } from "../components/PageStates";
import { ProductCard } from "../components/ProductCard";
import { Reveal } from "../components/Reveal";
import { products as catalogue } from "../data/products";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useResource";
import { stagger, useInView } from "../hooks/useReveal";
import type { Category } from "../types/product";

const INSTAGRAM_URL = "https://www.instagram.com/ade.footwear/";

// Real product photos, reused across sections until the owner supplies
// workshop and lifestyle photography.
const photo = (slug: string) => catalogue.find((p) => p.slug === slug)!.images[0];

function SectionHeading({ id, title, children, action }: { id: string; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
    return (
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="max-w-2xl">
                <h2 id={id} className="display-lg">
                    {title}
                </h2>
                {children && <div className="mt-5 text-lg leading-relaxed text-sand">{children}</div>}
            </div>
            {action}
        </Reveal>
    );
}

function Featured() {
    const products = useProducts();

    return (
        <section aria-labelledby="featured-title" className="wrap py-24 lg:py-36">
            <SectionHeading
                id="featured-title"
                title="Featured pairs"
                action={
                    <Link to="/shop" className="link-arrow">
                        View all products <ArrowRightIcon />
                    </Link>
                }
            >
                Handpicked styles for your everyday look.
            </SectionHeading>
            <div className="mt-14">
                {products.status === "loading" && <ProductGridSkeleton />}
                {products.status === "error" && <ErrorState onRetry={products.retry} />}
                {products.status === "success" && (
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 lg:gap-x-6">
                        {products.data
                            .filter((product) => product.featured)
                            .slice(0, 4)
                            .map((product, index) => (
                                <Reveal as="li" key={product.id} delay={stagger(index)}>
                                    <ProductCard product={product} />
                                </Reveal>
                            ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function About() {
    const image = photo("woven-buckle-derby");

    return (
        <section id="about" aria-labelledby="about-title" className="scroll-mt-20 border-t border-seam">
            <div className="wrap grid items-center gap-14 py-24 lg:grid-cols-12 lg:gap-10 lg:py-36">
                <Reveal as="figure" zoom className="lg:col-span-6">
                    <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-walnut">
                        <img
                            src={image.src}
                            alt="A woven Ade Foot Wear derby held up with its thank-you tag still attached"
                            loading="lazy"
                            style={{ objectPosition: "50% 70%" }}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <figcaption className="mt-4 text-sm text-sand">Every pair leaves the bench with a thank-you tag.</figcaption>
                </Reveal>

                <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
                    <h2 id="about-title" className="display-lg">
                        More than <span className="text-gold">just footwear</span>
                    </h2>
                    <div className="mt-8 space-y-5 text-lg leading-relaxed text-bone/85">
                        <p>
                            Ade Foot Wear is a Nigerian brand built on the belief that great shoes do more than cover your
                            feet. They carry your story.
                        </p>
                        <p>
                            We make handcrafted, high-quality footwear that blends timeless style, comfort and durability,
                            for people who move with purpose.
                        </p>
                    </div>
                    <div className="mt-6">
                        <PlaceholderNote>Story copy from the mockup; owner to approve.</PlaceholderNote>
                    </div>
                    <Link to="/shop" className="link-arrow mt-10">
                        Shop the collection <ArrowRightIcon />
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

const COLLECTIONS: { category: Category; slug: string; focus: string }[] = [
    { category: "Shoes", slug: "woven-buckle-derby", focus: "50% 60%" },
    { category: "Sandals", slug: "two-strap-leather-slides", focus: "50% 60%" },
    { category: "Slippers", slug: "v-buckle-mules", focus: "50% 55%" },
];

function Collections() {
    const products = useProducts();
    const countFor = (category: Category) =>
        products.status === "success" ? products.data.filter((p) => p.category === category).length : null;

    return (
        <section aria-labelledby="collections-title" className="wrap pb-24 lg:pb-36">
            <SectionHeading id="collections-title" title="Shop by category">
                Find your pair by the way you wear it.
            </SectionHeading>
            <ul className="mt-14 grid gap-4 sm:grid-cols-3 lg:gap-6">
                {COLLECTIONS.map(({ category, slug, focus }, index) => {
                    const image = photo(slug);
                    const count = countFor(category);
                    return (
                        <Reveal as="li" key={category} delay={stagger(index)} zoom>
                            <Link
                                to={`/shop?category=${category}`}
                                className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-walnut sm:aspect-[3/4]"
                            >
                                <img
                                    src={image.src}
                                    alt=""
                                    loading="lazy"
                                    style={{ objectPosition: focus }}
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                                />
                                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-4">
                                    <span>
                                        <span className="block font-display text-2xl font-bold">{category}</span>
                                        <span className="mt-0.5 block text-sm text-sand">
                                            {count === null ? " " : `${count} ${count === 1 ? "style" : "styles"}`}
                                        </span>
                                    </span>
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-ink transition-transform duration-300 ease-out group-hover:translate-x-1">
                                        <ArrowRightIcon />
                                    </span>
                                </span>
                            </Link>
                        </Reveal>
                    );
                })}
            </ul>
        </section>
    );
}

const REASONS = [
    { icon: NeedleIcon, title: "Handcrafted", text: "Every pair is carefully made by skilled artisans with years of experience." },
    { icon: HideIcon, title: "Premium materials", text: "High-quality leather and durable materials for long-lasting wear." },
    { icon: PinIcon, title: "Nigerian made", text: "Proudly local, supporting our people and our craftsmanship." },
    { icon: ShieldIcon, title: "Comfort and durability", text: "Designed for everyday wear, built to last." },
    { icon: ChatIcon, title: "Customer focused", text: "Your satisfaction drives us. We're always here to help." },
];

function WhyAde() {
    return (
        <section aria-labelledby="why-title" className="bg-coal">
            <div className="wrap grid gap-14 py-24 lg:grid-cols-12 lg:gap-10 lg:py-36">
                <Reveal className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
                    <h2 id="why-title" className="display-lg">
                        Why <span className="text-gold">Ade</span>
                    </h2>
                    <p className="mt-6 max-w-sm text-lg leading-relaxed text-sand">More than style. It's a commitment.</p>
                    <div className="mt-6">
                        <PlaceholderNote>Brand promises from the mockup; owner to approve.</PlaceholderNote>
                    </div>
                </Reveal>
                <ul className="divide-y divide-seam border-y border-seam lg:col-span-7">
                    {REASONS.map(({ icon: Icon, title, text }, index) => (
                        <Reveal as="li" key={title} delay={stagger(index)} className="grid grid-cols-[auto_1fr] gap-x-6 py-8 sm:gap-x-10">
                            <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/40 text-gold">
                                <Icon width={26} height={26} />
                            </span>
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
                                <p className="mt-2 max-w-md leading-relaxed text-sand">{text}</p>
                            </div>
                        </Reveal>
                    ))}
                </ul>
            </div>
        </section>
    );
}

const DELIVERY_STEPS = [
    {
        title: "Send your order request",
        text: "Choose your pairs and sizes, then send your request at checkout. No payment is taken online.",
    },
    {
        title: "We confirm the details",
        text: "Ade Foot Wear contacts you to confirm availability, the delivery fee and timing.",
    },
    {
        title: "Your pair arrives",
        text: "Delivered to your door, or ready for pickup.",
        placeholder: "Delivery areas, fees, timing and pickup options to be confirmed by the owner.",
    },
];

function Delivery() {
    const image = photo("two-strap-leather-slides");

    return (
        <section id="delivery" aria-labelledby="delivery-title" className="scroll-mt-20">
            <div className="wrap grid items-center gap-14 py-24 lg:grid-cols-12 lg:gap-10 lg:py-36">
                <Reveal className="lg:col-span-6">
                    <h2 id="delivery-title" className="display-lg">
                        How delivery works
                    </h2>
                    <ol className="mt-12 space-y-10">
                        {DELIVERY_STEPS.map((step, index) => (
                            <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-x-5">
                                <span className="font-display text-5xl font-extrabold leading-none text-gold" aria-hidden="true">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="text-xl font-semibold sm:text-2xl">{step.title}</h3>
                                    <p className="mt-2 max-w-md leading-relaxed text-sand">{step.text}</p>
                                    {step.placeholder && (
                                        <div className="mt-3">
                                            <PlaceholderNote>{step.placeholder}</PlaceholderNote>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </Reveal>
                <Reveal as="figure" zoom delay={120} className="lg:col-span-5 lg:col-start-8">
                    <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-walnut">
                        <img
                            src={image.src}
                            alt="Two-strap leather slides on a wooden table beside a sheet of Ade Foot Wear stickers"
                            loading="lazy"
                            style={{ objectPosition: "60% 55%" }}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

const REVIEWS = [
    { quote: "Quality is top-notch! The shoes are even better in person. Will definitely be ordering again.", name: "Tunde A.", place: "Lagos" },
    { quote: "Comfortable, stylish and durable. Ade really delivers on their promise.", name: "Blessing O.", place: "Abuja" },
    { quote: "I've bought three pairs already. The craftsmanship is amazing and the delivery was fast.", name: "Emeka J.", place: "Port Harcourt" },
];

function Reviews() {
    return (
        <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-20 border-t border-seam">
            <div className="wrap py-24 lg:py-36">
                <SectionHeading id="reviews-title" title="What customers say">
                    <PlaceholderNote>Sample reviews from the mockup. Replace with real, approved reviews before launch.</PlaceholderNote>
                </SectionHeading>
                <ul className="mt-14 grid gap-6 md:grid-cols-3">
                    {REVIEWS.map((review, index) => (
                        <Reveal as="li" key={review.name} delay={stagger(index)}>
                            <figure className="flex h-full flex-col justify-between rounded-[1.75rem] border border-seam bg-coal p-8">
                                <blockquote className="font-display text-xl font-medium leading-snug sm:text-2xl">
                                    <p>
                                        <span className="text-gold">“</span>
                                        {review.quote}
                                        <span className="text-gold">”</span>
                                    </p>
                                </blockquote>
                                <figcaption className="mt-10 flex items-center gap-3 border-t border-seam pt-5">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-walnut font-semibold text-gold" aria-hidden="true">
                                        {review.name[0]}
                                    </span>
                                    <span>
                                        <span className="block font-semibold">{review.name}</span>
                                        <span className="block text-sm text-sand">{review.place}</span>
                                    </span>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </ul>
            </div>
        </section>
    );
}

function Showcase() {
    const stripRef = useRef<HTMLDivElement>(null);
    const inView = useInView(stripRef);
    const frames = [...catalogue, ...catalogue];

    return (
        <section aria-labelledby="showcase-title" className="overflow-hidden border-t border-seam py-24 lg:py-36">
            <div className="wrap">
                <SectionHeading
                    id="showcase-title"
                    title="Fresh off the bench"
                    action={
                        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="link-arrow">
                            <InstagramIcon width={18} height={18} /> Follow @ade.footwear
                        </a>
                    }
                >
                    New pairs land on Instagram first.
                </SectionHeading>
            </div>
            <div ref={stripRef} className="group mt-14 motion-reduce:overflow-x-auto">
                <ul
                    className="flex w-max animate-marquee gap-4 pl-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:pl-6 lg:gap-6 lg:pl-10"
                    style={{ animationPlayState: inView ? undefined : "paused" }}
                >
                    {frames.map((product, index) => {
                        const image = product.images[0];
                        const duplicate = index >= catalogue.length;
                        return (
                            <li key={`${product.id}-${index}`} aria-hidden={duplicate} className="w-56 shrink-0 sm:w-72">
                                <Link
                                    to={`/products/${product.slug}`}
                                    tabIndex={duplicate ? -1 : undefined}
                                    className="block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-walnut"
                                >
                                    <img
                                        src={image.src}
                                        alt={duplicate ? "" : image.alt}
                                        loading="lazy"
                                        style={{ objectPosition: image.focus }}
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.05]"
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

function FinalCta() {
    return (
        <section aria-labelledby="cta-title" className="wrap pb-24 lg:pb-36">
            <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-walnut px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
                <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
                    <h2 id="cta-title" className="display-xl">
                        Step into your <span className="text-gold">next pair</span>
                    </h2>
                    <div>
                        <p className="max-w-sm text-lg leading-relaxed text-bone/85">
                            Premium handcrafted footwear for every occasion. Pick your size and send your order request in
                            minutes.
                        </p>
                        <Link to="/shop" className="btn-primary mt-8">
                            Shop now <ArrowRightIcon />
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

export function HomePage() {
    useDocumentTitle();

    return (
        <>
            <HeroSlideshow />
            <Featured />
            <About />
            <Collections />
            <WhyAde />
            <Delivery />
            <Reviews />
            <Showcase />
            <FinalCta />
        </>
    );
}
