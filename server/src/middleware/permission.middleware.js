"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDocumentRole = exports.hasMinimumRole = exports.ROLE_HIERARCHY = void 0;
exports.getDocumentAndRole = getDocumentAndRole;
const db_1 = require("../config/db");
exports.ROLE_HIERARCHY = {
    OWNER: 4,
    EDITOR: 3,
    COMMENTER: 2,
    VIEWER: 1,
    NONE: 0,
};
/**
 * Checks if a given user role satisfies the minimum required role.
 */
const hasMinimumRole = (userRole, requiredRole) => {
    return (exports.ROLE_HIERARCHY[userRole] || 0) >= (exports.ROLE_HIERARCHY[requiredRole] || 0);
};
exports.hasMinimumRole = hasMinimumRole;
/**
 * Helper to fetch a document and calculate the effective role of a user.
 */
async function getDocumentAndRole(documentId, userId) {
    const document = await db_1.prisma.document.findUnique({
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
        return { document: null, role: "NONE", share: null };
    }
    if (document.ownerId === userId) {
        return { document, role: "OWNER", share: null };
    }
    const share = document.shares.find((s) => s.userId === userId) || null;
    if (share) {
        return { document, role: share.role, share };
    }
    return { document, role: "NONE", share: null };
}
/**
 * Express middleware factory to require a minimum document role.
 * Expects `req.params.id` to contain the document ID and `req.user` to be set by `requireAuth`.
 */
const requireDocumentRole = (minRole) => {
    return async (req, res, next) => {
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
            if (role === "NONE" || !(0, exports.hasMinimumRole)(role, minRole)) {
                return res.status(403).json({
                    error: `Forbidden: You need ${minRole} permissions or higher to perform this action`,
                    requiredRole: minRole,
                    currentRole: role,
                });
            }
            req.documentContext = { document, role };
            next();
        }
        catch (error) {
            console.error("Error in requireDocumentRole middleware:", error);
            return res.status(500).json({ error: "Internal server error during authorization" });
        }
    };
};
exports.requireDocumentRole = requireDocumentRole;
