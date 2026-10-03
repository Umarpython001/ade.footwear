import { createClient } from "@supabase/supabase-js";

// Public-safe values from frontend/.env (Vite inlines them into the bundle;
// the anon/publishable key is designed to be visible in the browser).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// False until frontend/.env is filled in, so the UI can show a clear message
// instead of crashing on a missing client.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl as string, supabaseAnonKey as string)
    : null;

// The token the FastAPI backend verifies on /orders calls.
export async function getAccessToken(): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
}
