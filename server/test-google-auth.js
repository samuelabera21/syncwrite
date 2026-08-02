require("dotenv/config");
const fetch = global.fetch;

async function testCredentials() {
    console.log("Testing Google Client Credentials...");
    console.log("Client ID length:", process.env.GOOGLE_CLIENT_ID?.length);
    console.log("Client Secret length:", process.env.GOOGLE_CLIENT_SECRET?.length);
    
    // We send a dummy code to the token endpoint.
    // If the credentials (ID and Secret) are VALID, Google will return "invalid_grant" (because the code is fake).
    // If the credentials are INVALID, Google will return "invalid_client".
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            client_secret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
            code: "dummy_code_to_test_credentials",
            grant_type: "authorization_code",
            redirect_uri: "http://localhost:5000/api/auth/callback/google"
        }).toString()
    });

    const data = await response.json();
    console.log("\nResponse from Google Token Endpoint:");
    console.log(data);

    if (data.error === "invalid_client") {
        console.log("\n❌ RESULT: Your Client ID or Secret are definitely invalid according to Google.");
        console.log("This usually means the secret was reset, the project was deleted, or there's a copy-paste error.");
    } else if (data.error === "invalid_grant") {
        console.log("\n✅ RESULT: Your Client ID and Secret are VALID! Google accepted them.");
    }
}

testCredentials();
