import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:5000",
});

export const { useSession, signIn, signUp, signOut } = authClient;