import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";

export type EffectiveRole = "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER" | "NONE";

export const ROLE_HIERARCHY: Record<EffectiveRole, number> = {
    OWNER: 4,
    EDITOR: 3,
    COMMENTER: 2,
    VIEWER: 1,
    NONE: 0,
};

/**
 * Checks if a given user role satisfies the minimum required role.
 */
export const hasMinimumRole = (userRole: EffectiveRole, requiredRole: EffectiveRole): boolean => {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

/**
 * Helper to fetch a document and calculate the effective role of a user.
 */
export async function getDocumentAndRole(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            shares: {
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } },
                },
            },
            _count: { select: { comments: true } },
        },
    });

    if (!document) {
        return { document: null, role: "NONE" as EffectiveRole, share: null };
    }

    if (document.ownerId === userId) {
        return { document, role: "OWNER" as EffectiveRole, share: null };
    }

    const share = document.shares.find((s: any) => s.userId === userId) || null;
    if (share) {
        return { document, role: share.role as EffectiveRole, share };
    }

    return { document, role: "NONE" as EffectiveRole, share: null };
}

// Extend Express Request type to include document context
declare global {
    namespace Express {
        interface Request {
            documentContext?: {
                document: NonNullable<Awaited<ReturnType<typeof getDocumentAndRole>>["document"]>;
                role: EffectiveRole;
            };
        }
    }
}

/**
 * Express middleware factory to require a minimum document role.
 * Expects `req.params.id` to contain the document ID and `req.user` to be set by `requireAuth`.
 */
export const requireDocumentRole = (minRole: EffectiveRole) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const documentId = String(req.params.id || "");
            const userId = req.user?.id;

            if (!documentId) {
                return res.status(400).json({ error: "Document ID is required" });
            }

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized: Active session required" });
            }

            const { document, role } = await getDocumentAndRole(documentId, userId);

            if (!document) {
                return res.status(404).json({ error: "Document not found" });
            }

            if (role === "NONE" || !hasMinimumRole(role, minRole)) {
                return res.status(403).json({
                    error: `Forbidden: You need ${minRole} permissions or higher to perform this action`,
                    requiredRole: minRole,
                    currentRole: role,
                });
            }

            req.documentContext = { document, role };
            next();
        } catch (error) {
            console.error("Error in requireDocumentRole middleware:", error);
            return res.status(500).json({ error: "Internal server error during authorization" });
        }
    };
};
