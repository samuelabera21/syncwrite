"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreRevision = exports.createRevision = exports.getRevisions = void 0;
const db_1 = require("../config/db");
// 1. View Document Revision History
const getRevisions = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
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
        const revisions = await db_1.prisma.documentRevision.findMany({
            where: { documentId },
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
// 2. Create a Document Snapshot / Revision
const createRevision = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
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
        const latestRevision = await db_1.prisma.documentRevision.findFirst({
            where: { documentId },
            orderBy: { versionNum: "desc" },
        });
        const nextVersionNum = (latestRevision?.versionNum || 0) + 1;
        const revision = await db_1.prisma.documentRevision.create({
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
    }
    catch (error) {
        console.error("Error creating revision:", error);
        return res.status(500).json({ error: "Failed to create document revision" });
    }
};
exports.createRevision = createRevision;
// 3. Restore an Earlier Version
const restoreRevision = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const revisionId = String(req.params.revisionId);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
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
        const revision = await db_1.prisma.documentRevision.findUnique({
            where: { id: revisionId },
        });
        if (!revision || revision.documentId !== documentId) {
            return res.status(404).json({ error: "Revision not found" });
        }
        // Update document content with the revision's content snapshot
        const updatedDocument = await db_1.prisma.document.update({
            where: { id: documentId },
            data: {
                content: revision.content,
                lastModified: new Date(),
            },
        });
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
