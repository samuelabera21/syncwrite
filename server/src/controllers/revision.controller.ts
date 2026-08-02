import { Request, Response } from "express";
import { prisma } from "../config/db";
import { getDocumentAndRole, hasMinimumRole } from "../middleware/permission.middleware";
import { flushDoc, restoreDocState } from "../websocket/collaboration";

// 1. View Document Revision History (Viewer+)
export const getRevisions = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (role === "NONE" || !hasMinimumRole(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to revisions" });
        }

        const revisions = await prisma.documentRevision.findMany({
            where: { documentId },
            include: {
                creator: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ revisions });
    } catch (error) {
        console.error("Error fetching revisions:", error);
        return res.status(500).json({ error: "Failed to fetch document revisions" });
    }
};

// 2. Create a Document Snapshot / Revision (Editor+)
export const createRevision = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (!hasMinimumRole(role, "EDITOR")) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions or higher to create revisions" });
        }

        // Flush in-memory Yjs doc to database to get the absolute latest state
        await flushDoc(documentId);

        const currentDoc = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!currentDoc || !currentDoc.content) {
            return res.status(400).json({ error: "Document has no content snapshot to save" });
        }

        const latestRevision = await prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });

        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;

        const revision = await prisma.documentRevision.create({
            data: {
                documentId,
                content: currentDoc.content,
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

// 3. Restore an Earlier Version (Editor+)
export const restoreRevision = async (req: Request, res: Response) => {
    try {
        const documentId = String(req.params.id);
        const revisionId = String(req.params.revisionId);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(documentId, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (!hasMinimumRole(role, "EDITOR")) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions or higher to restore revisions" });
        }

        const revision = await prisma.documentRevision.findUnique({
            where: { id: revisionId },
        });

        if (!revision || revision.documentId !== documentId) {
            return res.status(404).json({ error: "Revision not found on this document" });
        }

        // 1. Generate new CRDT operations (deletions and insertions) that revert the 
        // current document state back to the snapshot's text. This ensures clients accept the change.
        const restoredStateBytes = await restoreDocState(documentId, revision.content);

        // 2. Update document content with the newly appended CRDT state
        const updatedDocument = await prisma.document.update({
            where: { id: documentId },
            data: {
                content: restoredStateBytes,
                lastModified: new Date(),
            },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
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
                content: restoredStateBytes,
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