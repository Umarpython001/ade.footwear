// Import axios: the HTTP library used for every backend call.
import axios from "axios";
// Import getAccessToken: reads the current Supabase session token (null when signed out).
import { getAccessToken } from "./supabase";

// Comment: one axios instance for every backend call (BACKEND_PLAN.md section 7).
// Comment: the base URL comes from frontend/.env (VITE_API_URL) and defaults to the
// Comment: local FastAPI server, so a missing .env still works in development.
// Create the shared client: baseURL prefixes every relative path (api.get("/products/") -> http://localhost:8000/products/).
export const api = axios.create({
    // baseURL: from VITE_API_URL when set, else the local FastAPI dev server.
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

// Comment: attach the Supabase access token when signed in. The backend only requires
// Comment: it for /orders calls; product calls work either way.
// Register a request interceptor: runs before EVERY request made through `api`.
api.interceptors.request.use(async (config) => {
    // Read the current access token (null when signed out or unconfigured).
    const token = await getAccessToken();
    // Only attach the header when a token exists; product endpoints need none.
    if (token) {
        // Authorization: Bearer <token> -- the backend's get_current_user verifies this.
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Return the (possibly modified) config so the request proceeds.
    return config;
});
