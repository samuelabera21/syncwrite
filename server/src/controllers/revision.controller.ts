import { Request, Response } from "express";
import { prisma } from "../config/db";

// 1. View Document Revision History
export const getRevisions = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { shares: true },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const isOwner = document.ownerId === userId;
        const hasAccess = isOwner || document.shares.some((s) => s.userId === userId);

        if (!hasAccess) {
            return res.status(403).json({ error: "Unauthorized access to revisions" });
        }

        const revisions = await prisma.documentRevision.findMany({
            where: { documentId },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ revisions });
    } catch (error) {
        console.error("Error fetching revisions:", error);
        return res.status(500).json({ error: "Failed to fetch document revisions" });
    }
};

// 2. Create a Document Snapshot / Revision
export const createRevision = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { shares: true },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        const isEditor = isOwner || shareRecord?.role === "EDITOR";

        if (!isEditor) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions to create revisions" });
        }

        if (!document.content) {
            return res.status(400).json({ error: "Document is empty" });
        }

        const latestRevision = await prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });

        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;

        const revision = await prisma.documentRevision.create({
            data: {
                documentId,
                content: document.content,
                versionNum: nextVersionNum,
                createdBy: userId,
            },
            include: {
                creator: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return res.status(201).json({ revision });
    } catch (error) {
        console.error("Error creating revision:", error);
        return res.status(500).json({ error: "Failed to create document revision" });
    }
};

// 3. Restore an Earlier Version
export const restoreRevision = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const revisionId = String(req.params.revisionId);
        const userId = req.user!.id;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { shares: true },
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        const isEditor = isOwner || shareRecord?.role === "EDITOR";

        if (!isEditor) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions to restore revisions" });
        }

        const revision = await prisma.documentRevision.findUnique({
            where: { id: revisionId },
        });

        if (!revision || revision.documentId !== documentId) {
            return res.status(404).json({ error: "Revision not found" });
        }

        // Update document content with the revision's content snapshot
        const updatedDocument = await prisma.document.update({
            where: { id: documentId },
            data: {
                content: revision.content,
                lastModified: new Date(),
            },
        });

        // Get latest version number to increment
        const latestRevision = await prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });

        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;

        // Save a new revision recording this restore action
        await prisma.documentRevision.create({
            data: {
                documentId,
                content: revision.content,
                versionNum: nextVersionNum,
                createdBy: userId,
            },
        });

        return res.status(200).json({
            message: "Document restored successfully",
            document: updatedDocument,
        });
    } catch (error) {
        console.error("Error restoring revision:", error);
        return res.status(500).json({ error: "Failed to restore document revision" });
    }
};