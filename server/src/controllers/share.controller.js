"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeShare = exports.updateShareRole = exports.shareDocument = exports.getDocumentShares = void 0;
const db_1 = require("../config/db");
const client_1 = require("@prisma/client");
const permission_middleware_1 = require("../middleware/permission.middleware");
// Helper to normalize input role strings
const normalizeRole = (roleInput) => {
    if (!roleInput)
        return client_1.PermissionRole.VIEWER;
    const upper = roleInput.toUpperCase();
    if (upper === "EDITOR")
        return client_1.PermissionRole.EDITOR;
    if (upper === "COMMENTER")
        return client_1.PermissionRole.COMMENTER;
    return client_1.PermissionRole.VIEWER;
};
// 1. Get Document Shares / Permissions (Viewer+)
const getDocumentShares = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (role === "NONE" || !(0, permission_middleware_1.hasMinimumRole)(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to document shares" });
        }
        const shares = await db_1.prisma.documentShare.findMany({
            where: { documentId },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
        });
        return res.status(200).json({
            shares,
            owner: document.owner,
            myRole: role,
        });
    }
    catch (error) {
        console.error("Error fetching document shares:", error);
        return res.status(500).json({ error: "Failed to fetch document shares" });
    }
};
exports.getDocumentShares = getDocumentShares;
// 2. Share Document with User (Owner Only)
const shareDocument = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { email, role, permission } = req.body;
        const effectiveRoleInput = role || permission;
        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ error: "A valid email address is required" });
        }
        const targetEmail = email.trim().toLowerCase();
        const roleToAssign = normalizeRole(effectiveRoleInput);
        // Verify document exists and requester is the OWNER
        const { document, role: callerRole } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can share it" });
        }
        // Find target user by email
        const targetUser = await db_1.prisma.user.findUnique({
            where: { email: targetEmail },
        });
        if (!targetUser) {
            return res.status(404).json({ error: "User with this email does not exist" });
        }
        if (targetUser.id === document.ownerId || targetUser.id === userId) {
            return res.status(400).json({ error: "Cannot share document with the owner" });
        }
        // Create or update share
        const documentShare = await db_1.prisma.documentShare.upsert({
            where: {
                documentId_userId: {
                    documentId,
                    userId: targetUser.id,
                },
            },
            update: { role: roleToAssign },
            create: {
                documentId,
                userId: targetUser.id,
                role: roleToAssign,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        return res.status(201).json({ share: documentShare });
    }
    catch (error) {
        console.error("Error sharing document:", error);
        return res.status(500).json({ error: "Failed to share document" });
    }
};
exports.shareDocument = shareDocument;
// 3. Update User Permission Role (Owner Only)
const updateShareRole = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user.id;
        const { role, permission } = req.body;
        const roleToAssign = normalizeRole(role || permission);
        const { document, role: callerRole } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can manage permissions" });
        }
        const existingShare = await db_1.prisma.documentShare.findUnique({
            where: { id: shareId },
        });
        if (!existingShare || existingShare.documentId !== documentId) {
            return res.status(404).json({ error: "Share record not found on this document" });
        }
        const updatedShare = await db_1.prisma.documentShare.update({
            where: { id: shareId },
            data: { role: roleToAssign },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        return res.status(200).json({ share: updatedShare });
    }
    catch (error) {
        console.error("Error updating share role:", error);
        return res.status(500).json({ error: "Failed to update permission" });
    }
};
exports.updateShareRole = updateShareRole;
// 4. Revoke Document Share (Owner Only)
const revokeShare = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user.id;
        const { document, role: callerRole } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can revoke access" });
        }
        const existingShare = await db_1.prisma.documentShare.findUnique({
            where: { id: shareId },
        });
        if (!existingShare || existingShare.documentId !== documentId) {
            return res.status(404).json({ error: "Share record not found on this document" });
        }
        await db_1.prisma.documentShare.delete({
            where: { id: shareId },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error revoking share:", error);
        return res.status(500).json({ error: "Failed to revoke access" });
    }
};
exports.revokeShare = revokeShare;
