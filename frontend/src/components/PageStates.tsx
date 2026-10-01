import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <header className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
            {children && <div className="mt-4 text-base leading-relaxed text-sand sm:text-lg">{children}</div>}
        </header>
    );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div role="status" aria-label="Loading products" className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] rounded-lg bg-bark" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-bark" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-bark" />
                </div>
            ))}
        </div>
    );
}

export function LoadingBlock({ label }: { label: string }) {
    return (
        <div role="status" aria-label={label} className="grid animate-pulse gap-4 md:grid-cols-2">
            <div className="aspect-[4/5] rounded-lg bg-bark" />
            <div className="space-y-4 pt-2">
                <div className="h-10 w-2/3 rounded bg-bark" />
                <div className="h-6 w-1/4 rounded bg-bark" />
                <div className="h-24 rounded bg-bark" />
            </div>
        </div>
    );
}

interface MessageProps {
    title: string;
    children?: ReactNode;
    action?: ReactNode;
}

export function MessageState({ title, children, action }: MessageProps) {
    return (
        <div className="rounded-xl border border-seam bg-coal px-6 py-14 text-center sm:px-10">
            <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
            {children && <div className="mx-auto mt-3 max-w-md leading-relaxed text-sand">{children}</div>}
            {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
        </div>
    );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div role="alert">
            <MessageState
                title="We couldn't load the products"
                action={
                    <button type="button" onClick={onRetry} className="btn-primary">
                        Try again
                    </button>
                }
            >
                Check your connection, then try again.
            </MessageState>
        </div>
    );
}

export function PlaceholderNote({ children }: { children: ReactNode }) {
    return (
        <p className="flex flex-wrap items-center gap-2 text-sm text-sand">
            <span className="placeholder-tag">Placeholder</span>
            {children}
        </p>
    );
}
