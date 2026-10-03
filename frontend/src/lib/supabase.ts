// Import createClient: builds a Supabase client from a project URL + anon key.
import { createClient } from "@supabase/supabase-js";

// Comment: public-safe values from frontend/.env (Vite inlines them into the bundle;
// Comment: the anon/publishable key is designed to be visible in the browser).
// Read the Supabase project URL from the environment (undefined when frontend/.env lacks it).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Read the anon/publishable key from the environment (public-safe by design).
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Comment: false until frontend/.env is filled in, so the UI can show a clear message
// Comment: instead of crashing on a missing client.
// True only when BOTH values exist; Boolean(...) turns the values into a real true/false.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Build the real client when configured, else null so callers can degrade gracefully.
// The ternary needs `as string` casts: TypeScript can't narrow the consts itself inside createClient(...).
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl as string, supabaseAnonKey as string)
    : null;

// Comment: the token the FastAPI backend verifies on /orders calls.
// Define getAccessToken: resolve the current session's JWT, or null when signed out/unconfigured.
// -> Promise<string | null>: the access token string, or null when there is no session.
export async function getAccessToken(): Promise<string | null> {
    // No client (unconfigured): there can be no session, so return null immediately.
    if (!supabase) return null;
    // Ask Supabase for the stored session (survives page reloads via localStorage).
    const { data } = await supabase.auth.getSession();
    // Return the token, or null when there is no session (?.) / token (?? null).
    return data.session?.access_token ?? null;
}
