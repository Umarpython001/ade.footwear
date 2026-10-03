import axios from "axios";
import { getAccessToken } from "./supabase";

// One axios instance for every backend call (BACKEND_PLAN.md section 7).
// The base URL comes from frontend/.env (VITE_API_URL) and defaults to the
// local FastAPI server, so a missing .env still works in development.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

// Attach the Supabase access token when signed in. The backend only requires
// it for /orders calls; product calls work either way.
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
