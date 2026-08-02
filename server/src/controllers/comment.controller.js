"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = exports.getComments = void 0;
const db_1 = require("../config/db");
const permission_middleware_1 = require("../middleware/permission.middleware");
// 1. Get All Comments for a Document (Viewer+)
const getComments = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        if (role === "NONE" || !(0, permission_middleware_1.hasMinimumRole)(role, "VIEWER")) {
            return res.status(403).json({ error: "Forbidden: Unauthorized access to comments" });
        }
        // Fetch top-level comments with their replies and user info
        const comments = await db_1.prisma.comment.findMany({
            where: { documentId, parentId: null },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                replies: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ comments });
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({ error: "Failed to fetch comments" });
    }
};
exports.getComments = getComments;
// 2. Add Comment or Reply (Commenter+)
const createComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { content, parentId } = req.body;
        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ error: "Comment content is required" });
        }
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        // Viewers CANNOT comment. Must be COMMENTER, EDITOR, or OWNER.
        if (!(0, permission_middleware_1.hasMinimumRole)(role, "COMMENTER")) {
            return res.status(403).json({
                error: "Forbidden: You do not have permission to add comments (Commenter role or higher required)",
                currentRole: role,
            });
        }
        // If parentId is provided, verify it exists and belongs to this document
        if (parentId) {
            const parentComment = await db_1.prisma.comment.findUnique({
                where: { id: parentId },
            });
            if (!parentComment || parentComment.documentId !== documentId) {
                return res.status(400).json({ error: "Invalid parent comment" });
            }
        }
        const newComment = await db_1.prisma.comment.create({
            data: {
                content: content.trim(),
                documentId,
                userId,
                parentId: parentId || null,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        // Notify parent comment author if it's a reply
        let parentCommentAuthorId = null;
        if (parentId) {
            const parentComment = await db_1.prisma.comment.findUnique({ where: { id: parentId } });
            if (parentComment && parentComment.userId !== userId) {
                parentCommentAuthorId = parentComment.userId;
                await db_1.prisma.notification.create({
                    data: {
                        userId: parentComment.userId,
                        type: "REPLY",
                        message: `${req.user.name} replied to your comment.`,
                        link: `/document/${documentId}?comment=${newComment.id}`,
                    }
                });
            }
        }
        // Notify document owner if someone else comments, and avoid duplicate if owner is also parent comment author
        if (document.ownerId !== userId && document.ownerId !== parentCommentAuthorId) {
            await db_1.prisma.notification.create({
                data: {
                    userId: document.ownerId,
                    type: "COMMENT",
                    message: `${req.user.name} commented on your document.`,
                    link: `/document/${documentId}?comment=${newComment.id}`,
                }
            });
        }
        return res.status(201).json({ comment: newComment });
    }
    catch (error) {
        console.error("Error creating comment:", error);
        return res.status(500).json({ error: "Failed to create comment" });
    }
};
exports.createComment = createComment;
// 3. Resolve or Update Comment (Author or Document Owner)
const updateComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const commentId = String(req.params.commentId);
        const userId = req.user.id;
        const { isResolved, content } = req.body;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const comment = await db_1.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment || comment.documentId !== documentId) {
            return res.status(404).json({ error: "Comment not found on this document" });
        }
        if (role === "NONE" || role === "VIEWER") {
            return res.status(403).json({ error: "Forbidden: You do not have permission to update comments" });
        }
        const isOwner = role === "OWNER";
        const isAuthor = comment.userId === userId;
        if (!isOwner && !isAuthor) {
            return res.status(403).json({ error: "Forbidden: You can only update your own comments or manage comments as the document owner" });
        }
        const updatedComment = await db_1.prisma.comment.update({
            where: { id: commentId },
            data: {
                isResolved: isResolved !== undefined ? Boolean(isResolved) : comment.isResolved,
                content: content !== undefined && typeof content === "string" && content.trim().length > 0 ? content.trim() : comment.content,
                updatedAt: new Date(),
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        return res.status(200).json({ comment: updatedComment });
    }
    catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ error: "Failed to update comment" });
    }
};
exports.updateComment = updateComment;
// 4. Delete Comment (Author or Document Owner)
const deleteComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const commentId = String(req.params.commentId);
        const userId = req.user.id;
        const { document, role } = await (0, permission_middleware_1.getDocumentAndRole)(documentId, userId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const comment = await db_1.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment || comment.documentId !== documentId) {
            return res.status(404).json({ error: "Comment not found on this document" });
        }
        if (role === "NONE" || role === "VIEWER") {
            return res.status(403).json({ error: "Forbidden: You do not have permission to delete comments" });
        }
        const isOwner = role === "OWNER";
        const isAuthor = comment.userId === userId;
        // Users can delete their own comments, or document owner can delete any comment
        if (!isAuthor && !isOwner) {
            return res.status(403).json({ error: "Forbidden: You can only delete your own comments or comments on documents you own" });
        }
        await db_1.prisma.comment.delete({
            where: { id: commentId },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ error: "Failed to delete comment" });
    }
};
exports.deleteComment = deleteComment;
