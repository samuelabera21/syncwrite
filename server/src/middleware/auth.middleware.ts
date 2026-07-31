import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";

// Extend Express Request type to include user and session
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                image?: string | null;
            };
            session?: {
                id: string;
                userId: string;
                expiresAt: Date;
            };
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Better Auth provides a helper to convert node/express headers into a session object
        const sessionData = await auth.api.getSession({
            headers: req.headers as any,
        });

        if (!sessionData || !sessionData.user || !sessionData.session) {
            return res.status(401).json({ error: "Unauthorized: No active session found" });
        }

        req.user = sessionData.user;
        req.session = sessionData.session;

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
};