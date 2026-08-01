"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const auth_1 = require("../config/auth");
const requireAuth = async (req, res, next) => {
    try {
        const sessionData = await auth_1.auth.api.getSession({
            headers: req.headers,
        });
        if (!sessionData?.user || !sessionData?.session) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "No active session found",
                },
            });
        }
        req.user = sessionData.user;
        req.session = sessionData.session;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
