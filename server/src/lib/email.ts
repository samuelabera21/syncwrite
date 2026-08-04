import nodemailer from "nodemailer";

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) => {
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
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // Force IPv4 to avoid ENETUNREACH errors on environments without IPv6 routing
            family: 4, 
            connectionTimeout: 10000, // 10 seconds timeout
            greetingTimeout: 10000,
            socketTimeout: 15000,
        } as any);

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"SyncWrite" <noreply@syncwrite.com>',
            to,
            subject,
            text,
            html,
        });

        console.log(`✅ Real email sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error: any) {
        console.error("❌ Failed to send real email via SMTP:", error?.message || error);
        throw error;
    }
};
