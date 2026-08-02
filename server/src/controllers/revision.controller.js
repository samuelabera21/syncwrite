"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreRevision = exports.createRevision = exports.getRevisions = void 0;
const db_1 = require("../config/db");
const permission_middleware_1 = require("../middleware/permission.middleware");
const collaboration_1 = require("../websocket/collaboration");
// 1. View Document Revision History (Viewer+)
const getRevisions = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (role === "NONE" || !(0, permission_middleware_1.hasMinimumRole)(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to revisions" });
        }
        const revisions = await db_1.prisma.documentRevision.findMany({
            where: { documentId },
            include: {
                creator: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ revisions });
    }
    catch (error) {
        console.error("Error fetching revisions:", error);
        return res.status(500).json({ error: "Failed to fetch document revisions" });
    }
};
exports.getRevisions = getRevisions;
// 2. Create a Document Snapshot / Revision (Editor+)
const createRevision = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (!(0, permission_middleware_1.hasMinimumRole)(role, "EDITOR")) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions or higher to create revisions" });
        }
        // Flush in-memory Yjs doc to database to get the absolute latest state
        await (0, collaboration_1.flushDoc)(documentId);
        const currentDoc = await db_1.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!currentDoc || !currentDoc.content) {
            return res.status(400).json({ error: "Document has no content snapshot to save" });
        }
        const latestRevision = await db_1.prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });
        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;
        const revision = await db_1.prisma.documentRevision.create({
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
    }
    catch (error) {
        console.error("Error creating revision:", error);
        return res.status(500).json({ error: "Failed to create document revision" });
    }
};
exports.createRevision = createRevision;
// 3. Restore an Earlier Version (Editor+)
const restoreRevision = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const revisionId = String(req.params.revisionId);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (!(0, permission_middleware_1.hasMinimumRole)(role, "EDITOR")) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions or higher to restore revisions" });
        }
        const revision = await db_1.prisma.documentRevision.findUnique({
            where: { id: revisionId },
        });
        if (!revision || revision.documentId !== documentId) {
            return res.status(404).json({ error: "Revision not found on this document" });
        }
        // Update document content with the revision's content snapshot
        const updatedDocument = await db_1.prisma.document.update({
            where: { id: documentId },
            data: {
                content: revision.content,
                lastModified: new Date(),
            },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
            },
        });
        // Broadcast restored content to any active WebSocket connections
        await (0, collaboration_1.reloadDocFromDb)(documentId);
        // Get latest version number to increment
        const latestRevision = await db_1.prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });
        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;
        // Save a new revision recording this restore action
        await db_1.prisma.documentRevision.create({
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
    }
    catch (error) {
        console.error("Error restoring revision:", error);
        return res.status(500).json({ error: "Failed to restore document revision" });
    }
};
exports.restoreRevision = restoreRevision;
