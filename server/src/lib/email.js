"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
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
    // TODO: When real credentials exist, implement nodemailer or Resend here.
    console.log(`Sending real email to ${to} via SMTP (Not yet fully implemented)`);
};
exports.sendEmail = sendEmail;
