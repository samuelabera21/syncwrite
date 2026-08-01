"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateDocument = exports.deleteDocument = exports.updateDocumentContent = exports.updateDocument = exports.getDocumentById = exports.createDocument = exports.getDocuments = void 0;
const db_1 = require("../config/db");
const decodeDocumentContent = (content) => {
    if (!content || content.length === 0) {
        return null;
    }
    try {
        const text = new TextDecoder().decode(content).trim();
        if (!text) {
            return null;
        }
        return JSON.parse(text);
    }
    catch {
        // Content may be Yjs binary data.
        // Do not try to interpret binary Yjs state as JSON.
        return null;
    }
};
// 1. Get User Documents (Dashboard)
const getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const filter = req.query.filter;
        // Owned documents
        const ownedDocuments = await db_1.prisma.document.findMany({
            where: { ownerId: userId },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: { lastModified: "desc" },
        });
        // Shared documents
        const sharedShares = await db_1.prisma.documentShare.findMany({
            where: { userId },
            include: {
                document: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                document: {
                    lastModified: "desc",
                },
            },
        });
        const sharedDocuments = sharedShares.map((share) => ({
            ...share.document,
            myRole: share.role,
        }));
        // Recently opened documents
        const recentOpens = await db_1.prisma.documentOpen.findMany({
            where: { userId },
            orderBy: {
                openedAt: "desc",
            },
            take: 10,
            include: {
                document: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        // Remove duplicate documents while preserving most recent opening
        const recentlyOpened = Array.from(new Map(recentOpens.map((open) => [
            open.documentId,
            {
                ...open.document,
                openedAt: open.openedAt,
                myRole: open.document.ownerId === userId
                    ? "OWNER"
                    : sharedShares.find((share) => share.documentId === open.documentId)?.role,
            },
        ])).values());
        // Existing filters
        if (filter === "owned") {
            return res.status(200).json({
                documents: ownedDocuments,
            });
        }
        if (filter === "shared") {
            return res.status(200).json({
                documents: sharedDocuments,
            });
        }
        if (filter === "recent") {
            return res.status(200).json({
                documents: recentlyOpened,
            });
        }
        // Dashboard response
        return res.status(200).json({
            owned: ownedDocuments,
            shared: sharedDocuments,
            recentlyOpened,
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        return res.status(500).json({
            error: "Failed to fetch documents",
        });
    }
};
exports.getDocuments = getDocuments;
// 2. Create a New Document
const createDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;
        const newDocument = await db_1.prisma.document.create({
            data: {
                title: title || "Untitled Document",
                ownerId: userId,
            },
        });
        return res.status(201).json({ document: newDocument });
    }
    catch (error) {
        console.error("Error creating document:", error);
        return res.status(500).json({ error: "Failed to create document" });
    }
};
exports.createDocument = createDocument;
// 3. Get Document By ID (Open Document)
const getDocumentById = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
            },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        if (!isOwner && !shareRecord) {
            return res.status(403).json({
                error: "Unauthorized: You do not have access to this document",
            });
        }
        await db_1.prisma.documentOpen.create({
            data: {
                documentId: id,
                userId,
            },
        });
        return res.status(200).json({
            document: {
                ...document,
                content: decodeDocumentContent(document.content),
            },
            role: isOwner ? "OWNER" : shareRecord?.role,
        });
    }
    catch (error) {
        console.error("Error fetching document:", error);
        return res.status(500).json({ error: "Failed to fetch document" });
    }
};
exports.getDocumentById = getDocumentById;
// 4. Update / Rename Document
const updateDocument = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.id;
        const { title } = req.body;
        const document = await db_1.prisma.document.findUnique({
            where: { id },
            include: { shares: true },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        const isEditor = shareRecord?.role === "EDITOR";
        if (!isOwner && !isEditor) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions to modify this document" });
        }
        const updatedDocument = await db_1.prisma.document.update({
            where: { id },
            data: {
                title: title !== undefined ? title : document.title,
            },
        });
        return res.status(200).json({ document: updatedDocument });
    }
    catch (error) {
        console.error("Error updating document:", error);
        return res.status(500).json({ error: "Failed to update document" });
    }
};
exports.updateDocument = updateDocument;
// 4. Update Document Content
const updateDocumentContent = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.id;
        const { content } = req.body;
        if (content === undefined) {
            return res.status(400).json({
                error: "Content is required",
            });
        }
        const document = await db_1.prisma.document.findUnique({
            where: { id },
            include: { shares: true },
        });
        if (!document) {
            return res.status(404).json({
                error: "Document not found",
            });
        }
        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((share) => share.userId === userId);
        const isEditor = shareRecord?.role === "EDITOR";
        if (!isOwner && !isEditor) {
            return res.status(403).json({
                error: "Forbidden: You require editor permissions to modify this document",
            });
        }
        const updatedDocument = await db_1.prisma.document.update({
            where: { id },
            data: {
                content: Buffer.from(JSON.stringify(content)),
                lastModified: new Date(),
            },
        });
        return res.status(200).json({
            document: {
                ...updatedDocument,
                content: decodeDocumentContent(updatedDocument.content),
            },
        });
    }
    catch (error) {
        console.error("Error updating document content:", error);
        return res.status(500).json({
            error: "Failed to update document content",
        });
    }
};
exports.updateDocumentContent = updateDocumentContent;
// 5. Delete Document
const deleteDocument = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (document.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the document owner can delete it" });
        }
        await db_1.prisma.document.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ error: "Failed to delete document" });
    }
};
exports.deleteDocument = deleteDocument;
// 6. Duplicate Document
const duplicateDocument = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.id;
        const document = await db_1.prisma.document.findUnique({
            where: { id },
            include: { shares: true },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        if (!isOwner && !shareRecord) {
            return res.status(403).json({ error: "Unauthorized access to document" });
        }
        const duplicated = await db_1.prisma.document.create({
            data: {
                title: `${document.title} (Copy)`,
                content: document.content,
                ownerId: userId,
            },
        });
        return res.status(201).json({ document: duplicated });
    }
    catch (error) {
        console.error("Error duplicating document:", error);
        return res.status(500).json({ error: "Failed to duplicate document" });
    }
};
exports.duplicateDocument = duplicateDocument;
