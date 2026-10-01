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

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <Icon {...props}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </Icon>
    );
}
