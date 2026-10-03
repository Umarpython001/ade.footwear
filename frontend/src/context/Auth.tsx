// Import createContext: makes the AuthContext object components subscribe to.
import { createContext } from "react";
// Import useContext: reads the nearest AuthContext value (used by useAuth below).
import { useContext } from "react";
// Import useEffect: subscribes to Supabase auth changes once when the provider mounts.
import { useEffect } from "react";
// Import useState: holds the current AuthState (loading -> signed-out/signed-in).
import { useState } from "react";
// Import ReactNode: type for the `children` prop (any renderable React content).
import type { ReactNode } from "react";
// Import isSupabaseConfigured: false when frontend/.env lacks the Supabase values.
import { isSupabaseConfigured } from "../lib/supabase";
// Import supabase: the client (or null); the provider subscribes via supabase.auth.
import { supabase } from "../lib/supabase";

// Comment: who is signed in, for any component that cares. Same Context pattern as the
// Comment: cart: one provider at the root, components read with useAuth().

// Define AuthUser: the signed-in identity as the UI needs it.
export interface AuthUser {
    // id: Supabase auth.users.id (becomes orders.user_id at checkout).
    id: string;
    // email: the user's email ("" when the provider sent none).
    email: string;
    // name: display name (Google full_name, falling back to email).
    name: string;
    // accessToken: the JWT the backend verifies on /orders calls.
    accessToken: string;
}

// Define AuthState: the three states any consumer must handle.
// loading: session not read yet (provider just mounted). signed-out: no session.
// signed-in: session present, carrying the user.
export type AuthState =
    | { status: "loading" }
    | { status: "signed-out" }
    | { status: "signed-in"; user: AuthUser };

// Create the context with a loading default (read before the provider mounts => "loading").
const AuthContext = createContext<AuthState>({ status: "loading" });

// Define AuthProvider: wraps the app (main.tsx) and publishes the session state below it.
// children: the rest of the app rendered inside the provider.
export function AuthProvider({ children }: { children: ReactNode }) {
    // state: current auth state; starts "loading" until the session check resolves.
    const [state, setState] = useState<AuthState>({ status: "loading" });

    // useEffect(..., []): run once on mount -- subscribe to auth, clean up on unmount.
    useEffect(() => {
        // Guard: unconfigured Supabase means nobody can ever be signed in.
        if (!isSupabaseConfigured || !supabase) {
            // Settle immediately as signed-out (no subscription possible).
            setState({ status: "signed-out" });
            // Return undefined: no cleanup needed when we never subscribed.
            return;
        }

        // Comment: fires immediately with the current session (including right after
        // Comment: the Google redirect lands) and again on every sign-in/out.
        // Subscribe to session changes; destructure out the subscription for cleanup.
        const {
            data: { subscription },
            // onAuthStateChange: callback runs now + on every SIGNED_IN/SIGNED_OUT/refresh event.
            // _event: the event name (unused -- session presence is what we branch on).
            // session: the session object, or null when signed out.
        } = supabase.auth.onAuthStateChange((_event, session) => {
            // If Supabase just handed us tokens in the URL, wipe them from the address bar.
            if (window.location.hash.includes("access_token")) {
                window.history.replaceState(null, "", window.location.pathname);
            }

            // session?.user exists: someone is signed in.
            if (session?.user) {
                // Publish the signed-in state with the identity the UI needs.
                setState({
                    // status: the signed-in branch of AuthState.
                    status: "signed-in",
                    // user: identity snapshot taken from the session.
                    user: {
                        // id: Supabase user id.
                        id: session.user.id,
                        // email: user's email, or "" when absent.
                        email: session.user.email ?? "",
                        // name: Google full_name from user_metadata, else email, else "".
                        // (user_metadata.full_name is set by the Google provider; the casts keep TS strict-happy.)
                        name:
                            (session.user.user_metadata?.full_name as string | undefined) ??
                            session.user.email ??
                            "",
                        // accessToken: the raw JWT from the session.
                        accessToken: session.access_token,
                    },
                });
            } else {
                // No session: publish signed-out (covers initial load + sign-out events).
                setState({ status: "signed-out" });
            }
        });

        // Cleanup: unsubscribe when the provider unmounts (StrictMode mounts twice in dev).
        return () => subscription.unsubscribe();
        // []: empty deps = subscribe exactly once per mount.
    }, []);

    // Provide the current state to every useAuth() consumer below this component.
    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// Define useAuth: the hook components call to read the session state.
// -> AuthState: loading | signed-out | signed-in + user.
export function useAuth(): AuthState {
    // Read the nearest AuthContext value (the provider's state).
    return useContext(AuthContext);
}
