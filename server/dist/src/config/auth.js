"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_adapter_1 = require("@better-auth/prisma-adapter");
const db_1 = require("./db");
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    trustedOrigins: ["http://localhost:5173"],
    database: (0, prisma_adapter_1.prismaAdapter)(db_1.prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
});
