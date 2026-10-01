import { createElement } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { useRevealOnce } from "../hooks/useReveal";

type RevealTag = "div" | "li" | "section" | "article" | "figure" | "header" | "aside";

interface RevealProps extends HTMLAttributes<HTMLElement> {
    as?: RevealTag;
    // Delay in ms, usually from stagger(index) for grid children.
    delay?: number;
    // Also settle any image inside from a slight zoom.
    zoom?: boolean;
}

// The one shared scroll-reveal mechanism for sections and card grids.
export function Reveal({ as = "div", delay = 0, zoom = false, className = "", style, children, ...rest }: RevealProps) {
    const { ref, state } = useRevealOnce<HTMLElement>();

    return createElement(
        as,
        {
            ...rest,
            ref,
            "data-reveal": state,
            className: `reveal ${zoom ? "reveal-zoom" : ""} ${className}`,
            style: { ...style, "--reveal-delay": `${delay}ms` } as CSSProperties,
        },
        children
    );
}
