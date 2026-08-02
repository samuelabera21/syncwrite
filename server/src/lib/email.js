"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async ({ to, subject, text, html, }) => {
    const isMock = !process.env.SMTP_HOST;
    if (isMock) {
        // Credential-free mode: Log to console beautifully
        console.log("\n" + "=".repeat(60));
        console.log(`📧 MOCK EMAIL INTERCEPTED`);
        console.log("=".repeat(60));
        console.log(`TO:       ${to}`);
        console.log(`SUBJECT:  ${subject}`);
        console.log("-".repeat(60));
        console.log(text);
        console.log("=".repeat(60) + "\n");
        return;
    }
    try {
        console.log(`Attempting to send real email to ${to} via SMTP...`);
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000, // 10 seconds timeout
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"SyncWrite" <noreply@syncwrite.com>',
            to,
            subject,
            text,
            html,
        });
        console.log(`✅ Real email sent to ${to}. Message ID: ${info.messageId}`);
    }
    catch (error) {
        console.error("❌ Failed to send real email via SMTP:", error?.message || error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
