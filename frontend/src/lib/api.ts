import axios from "axios";

// One axios instance for every backend call (BACKEND_PLAN.md section 7).
// The base URL comes from frontend/.env (VITE_API_URL) and defaults to the
// local FastAPI server, so a missing .env still works in development.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

// TODO (auth step): attach `Authorization: Bearer <token>` here once Supabase
// Google sign-in is wired up. The backend only needs it for /orders calls.
