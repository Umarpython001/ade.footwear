import { useState } from "react";
import { signInWithGoogle } from "../services/auth";
import { GoogleIcon, SpinnerIcon } from "./Icons";

// Follows Google's light sign-in button styling (white fill, #1f1f1f text,
// #747775 outline) so the brand mark sits on its approved ground.
export function GoogleSignInButton({ className = "", fullWidth = false }: { className?: string; fullWidth?: boolean }) {
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    async function handleClick() {
        setPending(true);
        setMessage(null);
        const result = await signInWithGoogle();
        setPending(false);
        if (!result.ok) setMessage(result.message);
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending}
                aria-busy={pending}
                className={`inline-flex items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-6 py-3.5 text-[0.95rem] font-semibold text-[#1f1f1f] transition-[background-color,transform] duration-200 ease-out hover:bg-[#f0eeea] active:scale-[0.98] disabled:cursor-wait ${
                    fullWidth ? "w-full" : "w-full sm:w-auto"
                }`}
            >
                {pending ? <SpinnerIcon className="animate-spin" /> : <GoogleIcon />}
                <span>{pending ? "Connecting…" : "Continue with Google"}</span>
            </button>
            <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm leading-relaxed text-sand">
                {message}
            </p>
        </div>
    );
}
