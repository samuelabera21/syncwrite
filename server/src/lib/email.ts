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
    const isMock = !process.env.BREVO_API_KEY;

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
        console.log(`Attempting to send real email to ${to} via Brevo HTTP API...`);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY as string,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "SyncWrite",
                    email: process.env.EMAIL_FROM || "noreply@syncwrite.com"
                },
                to: [{ email: to }],
                subject: subject,
                textContent: text,
                htmlContent: html || text
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Brevo API Error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const info = await response.json();
        console.log(`✅ Real email sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error: any) {
        console.error("❌ Failed to send real email via HTTP API:", error?.message || error);
        throw error;
    }
};
