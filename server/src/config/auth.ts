import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./db";




export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }: any) => {
            const { sendEmail } = await import("../lib/email");
            await sendEmail({
                to: user.email,
                subject: "Reset your SyncWrite password",
                text: `Click the link to reset your password: ${url}`,
            });
        }
    },
    socialProviders: {
        google: {
            clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }: any) => {
            const { sendEmail } = await import("../lib/email");
            await sendEmail({
                to: user.email,
                subject: "Verify your SyncWrite email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
    }
});