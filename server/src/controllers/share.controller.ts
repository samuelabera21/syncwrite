import { Request, Response } from "express";
import { prisma } from "../config/db";

// 1. Get Document Shares / Permissions
export const getDocumentShares = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                shares: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                },
            },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const isOwner = document.ownerId === userId;
        const hasAccess = isOwner || document.shares.some((s) => s.userId === userId);

        if (!hasAccess) {
            return res.status(403).json({ error: "Unauthorized access to document shares" });
        }

        return res.status(200).json({
            shares: document.shares,
        });
    } catch (error) {
        console.error("Error fetching document shares:", error);
        return res.status(500).json({ error: "Failed to fetch document shares" });
    }
};

// 2. Share Document with User
export const shareDocument = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: "Email and role are required" });
        }

        // Verify document exists and requester is owner
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the document owner can share it" });
        }

        // Find target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!targetUser) {
            return res.status(404).json({ error: "User with this email does not exist" });
        }

        if (targetUser.id === document.ownerId) {
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
            update: { role },
            create: {
                documentId,
                userId: targetUser.id,
                role,
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

// 3. Update User Permission Role
export const updateShareRole = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user!.id;
        const { role } = req.body;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the document owner can manage permissions" });
        }

        const updatedShare = await prisma.documentShare.update({
            where: { id: shareId },
            data: { role },
        });

        return res.status(200).json({ share: updatedShare });
    } catch (error) {
        console.error("Error updating share role:", error);
        return res.status(500).json({ error: "Failed to update permission" });
    }
};

// 4. Revoke Document Share
export const revokeShare = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const shareId = String(req.params.shareId);
        const userId = req.user!.id;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the document owner can revoke access" });
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