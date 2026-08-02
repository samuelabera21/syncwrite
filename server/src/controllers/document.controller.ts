import { Request, Response } from "express";
import { prisma } from "../config/db";
import { getDocumentAndRole, hasMinimumRole } from "../middleware/permission.middleware";

// 1. Get User Documents (Dashboard)
export const getDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const filter = req.query.filter as string;

        const ownedDocumentsRaw = await prisma.document.findMany({
            where: { ownerId: userId },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                },
                _count: { select: { comments: true } },
            },
            orderBy: { lastModified: "desc" },
        });
        // Map to include commentCount and remove internal _count
        const ownedDocuments = ownedDocumentsRaw.map((doc) => ({
            ...doc,
            commentCount: doc._count?.comments ?? 0,
            _count: undefined,
        }));

        const sharedSharesRaw = await prisma.documentShare.findMany({
            where: { userId },
            include: {
                document: {
                    include: {
                        owner: { select: { id: true, name: true, email: true, image: true } },
                        shares: {
                            include: {
                                user: { select: { id: true, name: true, email: true, image: true } },
                            },
                        },
                        _count: { select: { comments: true } },
                    },
                },
            },
            orderBy: { document: { lastModified: "desc" } },
        });
        // Map each shared document to include commentCount and remove internal _count
        const sharedShares = sharedSharesRaw.map((share) => ({
            ...share,
            document: {
                ...share.document,
                commentCount: share.document._count?.comments ?? 0,
                _count: undefined,
            },
        }));

        const sharedDocuments = sharedShares.map((share) => ({
            ...share.document,
            myRole: share.role,
        }));

        if (filter === "owned") {
            return res.status(200).json({ documents: ownedDocuments });
        }
        if (filter === "shared") {
            return res.status(200).json({ documents: sharedDocuments });
        }

        return res.status(200).json({
            owned: ownedDocuments,
            shared: sharedDocuments,
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return res.status(500).json({ error: "Failed to fetch documents" });
    }
};

// 2. Create a New Document
export const createDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { title } = req.body;

        const newDocument = await prisma.document.create({
            data: {
                title: title && typeof title === "string" && title.trim().length > 0 ? title.trim() : "Untitled Document",
                ownerId: userId,
            },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
            },
        });

        return res.status(201).json({ document: newDocument });
    } catch (error) {
        console.error("Error creating document:", error);
        return res.status(500).json({ error: "Failed to create document" });
    }
};

// 3. Get Document By ID (Open Document - Viewer+)
export const getDocumentById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(id, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (role === "NONE" || !hasMinimumRole(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: You do not have access to this document" });
        }

        return res.status(200).json({
            document,
            role,
            commentCount: document._count?.comments ?? 0,
        });
    } catch (error) {
        console.error("Error fetching document:", error);
        return res.status(500).json({ error: "Failed to fetch document" });
    }
};

// 4. Update / Rename Document (Editor+)
export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = req.user!.id;
        const { title } = req.body;

        const { document, role } = await getDocumentAndRole(id, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (!hasMinimumRole(role, "EDITOR")) {
            return res.status(403).json({ error: "Forbidden: You require editor permissions to modify this document" });
        }

        const updatedDocument = await prisma.document.update({
            where: { id },
            data: {
                title: title !== undefined && typeof title === "string" ? title.trim() || "Untitled Document" : document.title,
                lastModified: new Date(),
            },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
            },
        });

        return res.status(200).json({ document: updatedDocument });
    } catch (error) {
        console.error("Error updating document:", error);
        return res.status(500).json({ error: "Failed to update document" });
    }
};

// 5. Delete Document (Owner Only)
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(id, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden: Only the document owner can delete it" });
        }

        await prisma.document.delete({
            where: { id },
        });

        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ error: "Failed to delete document" });
    }
};

// 6. Duplicate Document (Viewer+)
export const duplicateDocument = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = req.user!.id;

        const { document, role } = await getDocumentAndRole(id, userId);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (role === "NONE" || !hasMinimumRole(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to document" });
        }

        const duplicated = await prisma.document.create({
            data: {
                title: `${document.title} (Copy)`,
                content: document.content,
                ownerId: userId,
            },
            include: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                shares: true,
            },
        });

        return res.status(201).json({ document: duplicated });
    } catch (error) {
        console.error("Error duplicating document:", error);
        return res.status(500).json({ error: "Failed to duplicate document" });
    }
};