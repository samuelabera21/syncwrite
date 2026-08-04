/// <reference types="vite/client" />
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "http://localhost:5000",
});

export const { useSession, signIn, signUp, signOut } = authClient;