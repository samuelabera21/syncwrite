"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        requireEmailVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const { sendEmail } = await Promise.resolve().then(() => __importStar(require("../lib/email")));
            await sendEmail({
                to: user.email,
                subject: "Verify your SyncWrite email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
        sendResetPassword: async ({ user, url }) => {
            const { sendEmail } = await Promise.resolve().then(() => __importStar(require("../lib/email")));
            await sendEmail({
                to: user.email,
                subject: "Reset your SyncWrite password",
                text: `Click the link to reset your password: ${url}`,
            });
        }
    },
});
