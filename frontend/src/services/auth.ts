import { isSupabaseConfigured, supabase } from "../lib/supabase";

// Google sign-in via Supabase Auth. The browser goes to Google and comes back
// to the same page with a session; AuthProvider (context/Auth.tsx) picks it up.

export type SignInResult = { ok: true } | { ok: false; message: string };

const NOT_CONFIGURED =
    "Google sign-in isn't connected yet. It will work as soon as the Supabase backend is set up.";

export async function signInWithGoogle(): Promise<SignInResult> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: NOT_CONFIGURED };
    }

    // On success the browser navigates away to Google, so callers almost
    // always see only the error path of this promise.
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
    });

    if (error) {
        return { ok: false, message: error.message };
    }
    return { ok: true };
}

export async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
}
