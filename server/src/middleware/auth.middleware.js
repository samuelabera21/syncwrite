"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const auth_1 = require("../config/auth");
const requireAuth = async (req, res, next) => {
    try {
        // Better Auth provides a helper to convert node/express headers into a session object
        const sessionData = await auth_1.auth.api.getSession({
            headers: req.headers,
        });
        if (!sessionData || !sessionData.user || !sessionData.session) {
            return res.status(401).json({ error: "Unauthorized: No active session found" });
        }
        req.user = sessionData.user;
        req.session = sessionData.session;
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
};
exports.requireAuth = requireAuth;
