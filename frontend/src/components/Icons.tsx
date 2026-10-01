import type { SVGProps } from "react";

// One drawn set: 24px grid, 1.6 stroke, round caps.
function Icon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        />
    );
}

export function CartIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
            <circle cx="9.5" cy="19.5" r="1.3" />
            <circle cx="17" cy="19.5" r="1.3" />
        </Icon>
    );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
        </Icon>
    );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M4 12h16M4 17h10" />
        </Icon>
    );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M6 6l12 12M18 6L6 18" />
        </Icon>
    );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="18" height="18" {...props}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </Icon>
    );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="16" height="16" {...props}>
            <path d="M12 5v14M5 12h14" />
        </Icon>
    );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="16" height="16" {...props}>
            <path d="M5 12h14" />
        </Icon>
    );
}

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="18" height="18" {...props}>
            <path d="M19 12H5M11 6l-6 6 6 6" />
        </Icon>
    );
}

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="16" height="16" {...props}>
            <path d="M9 5v14M15 5v14" />
        </Icon>
    );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="16" height="16" {...props}>
            <path d="M8 5.5v13l10-6.5z" />
        </Icon>
    );
}

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon width="20" height="20" {...props}>
            <path d="M12 3a9 9 0 1 0 9 9" />
        </Icon>
    );
}

// Handcrafted: needle and a loose thread.
export function NeedleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M4 20 17.5 6.5" />
            <path d="M16 4.5a2 2 0 0 1 3.5 3.5l-2 2" />
            <path d="M6 18c2.5 1.5 6 2 9-1s2.5-6 5-7" />
        </Icon>
    );
}

// Premium materials: a stretched leather hide.
export function HideIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M8 3c1.5 1 2.5 1.5 4 1.5S14.5 4 16 3c.5 2 2 3 4 3-1 2-1 4 0 6-1 2-1 4 0 6-2 0-3.5 1-4 3-1.5-1-2.5-1.5-4-1.5S9.5 20 8 21c-.5-2-2-3-4-3 1-2 1-4 0-6 1-2 1-4 0-6 2 0 3.5-1 4-3Z" />
        </Icon>
    );
}

export function PinIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
        </Icon>
    );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6Z" />
            <path d="m9 12 2 2 4-4" />
        </Icon>
    );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z" />
            <path d="M9 11h.01M12 11h.01M15 11h.01" />
        </Icon>
    );
}

// Google "G" in Google's brand colours, for the sign-in button only.
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false" {...props}>
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </Icon>
    );
}
