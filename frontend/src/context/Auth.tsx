import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

// Who is signed in, for any component that cares. Same Context pattern as the
// cart: one provider at the root, components read with useAuth().

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    accessToken: string;
}

export type AuthState =
    | { status: "loading" }
    | { status: "signed-out" }
    | { status: "signed-in"; user: AuthUser };

const AuthContext = createContext<AuthState>({ status: "loading" });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({ status: "loading" });

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setState({ status: "signed-out" });
            return;
        }

        // Fires immediately with the current session (including right after
        // the Google redirect lands) and again on every sign-in/out.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setState({
                    status: "signed-in",
                    user: {
                        id: session.user.id,
                        email: session.user.email ?? "",
                        name:
                            (session.user.user_metadata?.full_name as string | undefined) ??
                            session.user.email ??
                            "",
                        accessToken: session.access_token,
                    },
                });
            } else {
                setState({ status: "signed-out" });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    return useContext(AuthContext);
}
