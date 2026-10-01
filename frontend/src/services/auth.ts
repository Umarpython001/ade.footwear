// Stand-in for Supabase Google sign-in
// (supabase.auth.signInWithOAuth({ provider: "google" })). Only this file
// changes when the backend and Supabase project are ready.



export type SignInResult = { ok: true } | { ok: false; message: string };

const CONNECT_DELAY_MS = 600;

export async function signInWithGoogle(): Promise<SignInResult> {
    await new Promise((resolve) => setTimeout(resolve, CONNECT_DELAY_MS));
    return {
        ok: false,
        message: "Google sign-in isn't connected yet. It will work as soon as the Supabase backend is set up.",
    };
}
