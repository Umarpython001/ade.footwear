// Import isSupabaseConfigured: false when frontend/.env lacks the Supabase values.
import { isSupabaseConfigured } from "../lib/supabase";
// Import supabase: the client (or null); all auth calls go through it.
import { supabase } from "../lib/supabase";

// Comment: Google sign-in via Supabase Auth. The browser goes to Google and comes back
// Comment: to the same page with a session; AuthProvider (context/Auth.tsx) picks it up.

// Define SignInResult: success carries nothing; failure carries a message for the button to show.
export type SignInResult = { ok: true } | { ok: false; message: string };

// NOT_CONFIGURED: message shown when sign-in is attempted before Supabase is wired up.
const NOT_CONFIGURED =
    "Google sign-in isn't connected yet. It will work as soon as the Supabase backend is set up.";

// Define signInWithGoogle: start the Google OAuth flow. Almost always navigates away on success.
// -> Promise<SignInResult>: {ok:true} when the redirect started (or a previous session exists)...
// ...{ok:false, message} when Supabase is missing or Google returned an error.
export async function signInWithGoogle(): Promise<SignInResult> {
    // Guard: without a client there is nothing to call -- return the friendly message.
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: NOT_CONFIGURED };
    }

    // Comment: on success the browser navigates away to Google, so callers almost
    // Comment: always see only the error path of this promise. redirectTo strips any
    // Comment: query params/hash so stale error parameters never ride along. -- I fixed this after your retry URL kept old error params.
    // Start OAuth: Supabase redirects to Google, then back to redirectTo with a fresh session.
    const { error } = await supabase.auth.signInWithOAuth({
        // provider: "google" selects Google OAuth (enabled in the Supabase dashboard).
        provider: "google",
        // redirectTo: clean return address (origin + path only, no ?query or #hash).
        options: { redirectTo: window.location.origin + window.location.pathname },
    });

    // Supabase reports immediate failures (popup blocked, provider disabled) via error.
    if (error) {
        // Surface Supabase's message under the button.
        return { ok: false, message: error.message };
    }
    // No immediate error: the browser is leaving for Google (or already has a session).
    return { ok: true };
}

// Define signOut: end the Supabase session everywhere (clears the stored tokens).
// -> Promise<void>: nothing to return; the AuthProvider notices the session loss and flips to signed-out.
export async function signOut(): Promise<void> {
    // No client: nothing to sign out of; return quietly.
    if (!supabase) return;
    // Tell Supabase to sign out (revokes server-side and clears localStorage).
    await supabase.auth.signOut();
}
