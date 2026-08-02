import { Request, Response } from "express";
import { prisma } from "../config/db";
import { PermissionRole } from "@prisma/client";
import { getDocumentAndRole, hasMinimumRole } from "../middleware/permission.middleware";

// Helper to normalize input role strings
const normalizeRole = (roleInput?: string): PermissionRole => {
    if (!roleInput) return PermissionRole.VIEWER;
    const upper = roleInput.toUpperCase();
    if (upper === "EDITOR") return PermissionRole.EDITOR;
    if (upper === "COMMENTER") return PermissionRole.COMMENTER;
    return PermissionRole.VIEWER;
};

// 1. Get Document Shares / Permissions (Viewer+)
export const getDocumentShares = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (role === "NONE" || !hasMinimumRole(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to document shares" });
        }

        const shares = await prisma.documentShare.findMany({
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
    } catch (error) {
        console.error("Error fetching document shares:", error);
        return res.status(500).json({ error: "Failed to fetch document shares" });
    }
};

// 2. Share Document with User (Owner Only)
export const shareDocument = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;
        const { email, role, permission } = req.body;

        const effectiveRoleInput = role || permission;

        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ error: "A valid email address is required" });
        }

        const targetEmail = email.trim().toLowerCase();
        const roleToAssign = normalizeRole(effectiveRoleInput);

        // Verify document exists and requester is the OWNER
        const { document, role: callerRole } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can share it" });
        }

        // Find target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail },
        });

        if (!targetUser) {
            return res.status(404).json({ error: "User with this email does not exist" });
        }

        if (targetUser.id === document.ownerId || targetUser.id === userId) {
            return res.status(400).json({ error: "Cannot share document with the owner" });
        }

        // Create or update share
        const documentShare = await prisma.documentShare.upsert({
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
    } catch (error) {
        console.error("Error sharing document:", error);
        return res.status(500).json({ error: "Failed to share document" });
    }
};

// 3. Update User Permission Role (Owner Only)
export const updateShareRole = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user!.id;
        const { role, permission } = req.body;

        const roleToAssign = normalizeRole(role || permission);

        const { document, role: callerRole } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can manage permissions" });
        }

        const existingShare = await prisma.documentShare.findUnique({
            where: { id: shareId },
        });

        if (!existingShare || existingShare.documentId !== documentId) {
            return res.status(404).json({ error: "Share record not found on this document" });
        }

        const updatedShare = await prisma.documentShare.update({
            where: { id: shareId },
            data: { role: roleToAssign },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return res.status(200).json({ share: updatedShare });
    } catch (error) {
        console.error("Error updating share role:", error);
        return res.status(500).json({ error: "Failed to update permission" });
    }
};

// 4. Revoke Document Share (Owner Only)
export const revokeShare = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user!.id;

        const { document, role: callerRole } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (callerRole !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can revoke access" });
        }

        const existingShare = await prisma.documentShare.findUnique({
            where: { id: shareId },
        });

        if (!existingShare || existingShare.documentId !== documentId) {
            return res.status(404).json({ error: "Share record not found on this document" });
        }

        await prisma.documentShare.delete({
            where: { id: shareId },
        });

        return res.status(204).send();
    } catch (error) {
        console.error("Error revoking share:", error);
        return res.status(500).json({ error: "Failed to revoke access" });
    }
};