import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { products } from "../data/products";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInView } from "../hooks/useReveal";
import { formatNaira } from "../lib/format";
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from "./Icons";

const SLIDE_MS = 6500;

// Hero shows the real product photos; the bench lamp moves from pair to pair.
const slides = products.filter((product) => product.featured);

const HEADLINE = [
    { text: "Premium", gold: false },
    { text: "footwear for", gold: false },
    { text: "every move", gold: true },
];

const lineStyle = (index: number): CSSProperties => ({ animationDelay: `${150 + index * 110}ms` });

export function HeroSlideshow() {
    const [index, setIndex] = useState(0);
    const [userPaused, setUserPaused] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [focused, setFocused] = useState(false);
    const reducedMotion = useReducedMotion();
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef);

    const autoplayAllowed = !reducedMotion && !userPaused;
    const running = autoplayAllowed && !hovering && !focused && inView;
    const slide = slides[index];
    const go = (next: number) => setIndex((next + slides.length) % slides.length);

    return (
        <section
            ref={sectionRef}
            aria-labelledby="hero-title"
            className="relative isolate overflow-hidden bg-ink lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]"
        >
            {/* Photo stage: full-bleed behind the copy on mobile, its own column on desktop. */}
            <div
                role="group"
                aria-roledescription="carousel"
                aria-label="Featured pairs"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                className="absolute inset-0 -z-10 animate-settle lg:relative lg:inset-auto lg:z-0 lg:order-2 lg:mt-20 lg:h-[calc(100svh-5rem)] lg:overflow-hidden lg:rounded-bl-[2.5rem]"
            >
                {slides.map((item, i) => {
                    const image = item.images[0];
                    const active = i === index;
                    return (
                        <img
                            key={item.id}
                            src={image.src}
                            alt={active ? image.alt : ""}
                            aria-hidden={!active}
                            fetchPriority={i === 0 ? "high" : "low"}
                            decoding="async"
                            style={{ objectPosition: image.focus }}
                            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out [transition-duration:700ms,7000ms] ${
                                active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
                            }`}
                        />
                    );
                })}
                <div aria-hidden="true" className="absolute inset-0 bg-ink/[0.72] lg:hidden" />

                {/* Desktop caption plate, pinned to the stage like a shoebox label. */}
                <div
                    aria-live={running ? "off" : "polite"}
                    className="absolute bottom-0 left-0 hidden w-[min(24rem,80%)] rounded-tr-[1.75rem] bg-ink p-6 pr-8 lg:block"
                >
                    <p className="font-display text-xl font-semibold leading-tight">{slide.name}</p>
                    <p className="mt-1 text-sm text-sand">
                        {slide.category} · <span className="font-semibold text-gold">{formatNaira(slide.priceKobo)}</span>
                    </p>
                    <Link to={`/products/${slide.slug}`} className="link-arrow mt-4">
                        View this pair <ArrowRightIcon />
                    </Link>
                </div>
            </div>

            {/* Copy column */}
            <div className="wrap relative flex min-h-[100svh] flex-col justify-end pb-10 pt-28 lg:mx-0 lg:max-w-none lg:justify-center lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:pr-12 lg:pb-12 lg:pt-32">
                <h1 id="hero-title" className="display-xl" style={{ fontSize: "clamp(3rem, min(7vw, 10.5svh), 6rem)" }}>
                    {HEADLINE.map((line, i) => (
                        <span key={line.text} className="block overflow-hidden pb-[0.08em]">
                            <span
                                className={`block animate-line-up ${line.gold ? "text-gold" : ""}`}
                                style={lineStyle(i)}
                            >
                                {line.text}
                            </span>
                        </span>
                    ))}
                </h1>
                <p className="mt-7 max-w-md animate-rise text-lg leading-relaxed text-bone/85" style={lineStyle(3)}>
                    Style. Comfort. Quality. Handcrafted for queens and kings.
                </p>
                <div className="mt-9 flex animate-rise flex-wrap gap-3" style={lineStyle(4)}>
                    <Link to="/shop" className="btn-primary">
                        Shop now <ArrowRightIcon />
                    </Link>
                    <Link to="/#about" className="btn-ghost">
                        Our story
                    </Link>
                </div>

                {/* Slide controls */}
                <div
                    className="mt-12 flex animate-rise items-center gap-5 lg:mt-auto lg:pt-16"
                    style={lineStyle(5)}
                    onFocus={() => setFocused(true)}
                    onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
                    }}
                >
                    <p className="font-display text-sm font-semibold tabular-nums text-bone">
                        {String(index + 1).padStart(2, "0")}
                        <span className="text-sand"> / {String(slides.length).padStart(2, "0")}</span>
                    </p>
                    <div className="flex flex-1 gap-1.5" aria-hidden="true">
                        {slides.map((item, i) => (
                            <span key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-bone/20">
                                {i < index && <span className="block h-full w-full bg-bone/70" />}
                                {i === index &&
                                    (autoplayAllowed ? (
                                        <span
                                            key={index}
                                            onAnimationEnd={() => go(index + 1)}
                                            className="block h-full w-full origin-left bg-gold"
                                            style={{
                                                animation: `progress ${SLIDE_MS}ms linear both`,
                                                animationPlayState: running ? "running" : "paused",
                                            }}
                                        />
                                    ) : (
                                        <span className="block h-full w-full bg-gold" />
                                    ))}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => go(index - 1)}
                            aria-label="Previous pair"
                            className="grid h-10 w-10 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone"
                        >
                            <ArrowLeftIcon />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(index + 1)}
                            aria-label="Next pair"
                            className="grid h-10 w-10 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone"
                        >
                            <ArrowRightIcon />
                        </button>
                        {!reducedMotion && (
                            <button
                                type="button"
                                onClick={() => setUserPaused((paused) => !paused)}
                                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                                aria-pressed={userPaused}
                                className="grid h-10 w-10 place-items-center rounded-full text-bone/80 transition-colors hover:text-bone"
                            >
                                {userPaused ? <PlayIcon /> : <PauseIcon />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile caption */}
                <Link
                    to={`/products/${slide.slug}`}
                    className="mt-5 flex items-baseline justify-between gap-4 border-t border-bone/15 pt-4 text-sm lg:hidden"
                >
                    <span className="font-semibold">{slide.name}</span>
                    <span className="font-semibold text-gold">{formatNaira(slide.priceKobo)}</span>
                </Link>
            </div>
        </section>
    );
}
