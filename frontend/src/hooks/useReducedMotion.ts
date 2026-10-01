import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
        () => false
    );
}
