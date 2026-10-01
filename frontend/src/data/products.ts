import type { Product, ProductSize } from "../types/product";
import wovenDerby from "../assets/img1.png";
import strapSlides from "../assets/img2.png";
import plainDerby from "../assets/img3.png";
import buckleMules from "../assets/img4.png";

// [PLACEHOLDER] Dummy catalogue for development. The photos are real ADE
// products; every name, price, size and description below is invented and
// must be replaced with owner-approved data before launch.

const sizes = (all: string[], soldOut: string[] = []): ProductSize[] =>
    all.map((size) => ({ size, available: !soldOut.includes(size) }));

const ADULT_SIZES = ["39", "40", "41", "42", "43", "44", "45"];

export const products: Product[] = [
    {
        id: "p-001",
        slug: "woven-buckle-derby",
        name: "Woven Buckle Derby",
        description:
            "Black woven-texture leather derby with a side buckle strap, contrast welt stitching and a chunky lug sole.",
        category: "Shoes",
        priceKobo: 5_800_000,
        images: [
            {
                src: wovenDerby,
                alt: "Pair of black woven-leather derby shoes with buckle straps and thick lug soles, held up beside an Ade Foot Wear box",
                focus: "50% 55%",
            },
        ],
        sizes: sizes(ADULT_SIZES, ["45"]),
        available: true,
        featured: true,
    },
    {
        id: "p-002",
        slug: "two-strap-leather-slides",
        name: "Two-Strap Leather Slides",
        description:
            "Open-toe slides with two wide black leather straps on a cushioned footbed and a raised black sole.",
        category: "Sandals",
        priceKobo: 3_200_000,
        images: [
            {
                src: strapSlides,
                alt: "Pair of black two-strap leather slides on a wooden table next to Ade Foot Wear stickers",
                focus: "50% 55%",
            },
        ],
        sizes: sizes(ADULT_SIZES, ["39", "40"]),
        available: true,
        featured: true,
    },
    {
        id: "p-003",
        slug: "classic-lug-derby",
        name: "Classic Lug Derby",
        description:
            "Smooth black leather lace-up derby on a deep-tread lug sole. Clean enough for the office, sturdy enough for the street.",
        category: "Shoes",
        priceKobo: 4_500_000,
        images: [
            {
                src: plainDerby,
                alt: "Black smooth-leather derby shoe with a thick lug sole held in hand above a wooden bench",
                focus: "50% 92%",
            },
        ],
        sizes: sizes(ADULT_SIZES),
        available: true,
        featured: true,
    },
    {
        id: "p-004",
        slug: "v-buckle-mules",
        name: "V-Buckle Mules",
        description:
            "Backless black leather mules with a crossover vamp, metal V hardware and a tan scalloped insole.",
        category: "Slippers",
        priceKobo: 2_800_000,
        images: [
            {
                src: buckleMules,
                alt: "Pair of black leather backless mules with silver V hardware and tan insoles on a polished wooden floor",
                focus: "50% 50%",
            },
        ],
        sizes: sizes(ADULT_SIZES, ADULT_SIZES),
        available: false,
        featured: true,
    },
];
