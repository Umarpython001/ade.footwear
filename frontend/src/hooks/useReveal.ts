import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { REDUCED_MOTION_QUERY } from "./useReducedMotion";

export type RevealState = "pending" | "done";

function canReveal() {
    return "IntersectionObserver" in window && !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Reveals an element once, the first time it scrolls into view. Without
// IntersectionObserver or with reduced motion, content is shown immediately.
export function useRevealOnce<T extends Element>() {
    const ref = useRef<T>(null);
    const [state, setState] = useState<RevealState>(() => (canReveal() ? "pending" : "done"));

    useEffect(() => {
        const element = ref.current;
        if (state === "done" || !element) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setState("done");
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [state]);

    return { ref, state };
}

// Tracks whether an element is on screen, so looping motion can pause offscreen.
export function useInView<T extends Element>(ref: RefObject<T | null>): boolean {
    const [inView, setInView] = useState(true);

    useEffect(() => {
        const element = ref.current;
        if (!element || !("IntersectionObserver" in window)) return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return inView;
}

// Grid children stagger by index, capped so long lists never wait.
export const stagger = (index: number) => Math.min(index, 5) * 90;
