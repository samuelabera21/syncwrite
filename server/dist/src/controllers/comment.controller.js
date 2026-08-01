"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = exports.getComments = void 0;
const db_1 = require("../config/db");
// 1. Get All Comments for a Document
const getComments = async (req, res) => {
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
            return res.status(403).json({ error: "Unauthorized access to comments" });
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
// 2. Add Comment or Reply
const createComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const userId = req.user.id;
        const { content, parentId } = req.body;
        if (!content) {
            return res.status(400).json({ error: "Comment content is required" });
        }
        const document = await db_1.prisma.document.findUnique({
            where: { id: documentId },
            include: { shares: true },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const isOwner = document.ownerId === userId;
        const shareRecord = document.shares.find((s) => s.userId === userId);
        // Check if user has permission to comment (Viewer cannot comment usually, but Commenter/Editor/Owner can)
        const canComment = isOwner || shareRecord?.role === "COMMENTER" || shareRecord?.role === "EDITOR";
        if (!canComment) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to add comments" });
        }
        // If parentId is provided, verify it exists
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
                content,
                documentId,
                userId,
                parentId: parentId || null,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        return res.status(201).json({ comment: newComment });
    }
    catch (error) {
        console.error("Error creating comment:", error);
        return res.status(500).json({ error: "Failed to create comment" });
    }
};
exports.createComment = createComment;
// 3. Resolve or Update Comment
const updateComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const commentId = String(req.params.commentId);
        const userId = req.user.id;
        const { isResolved } = req.body;
        const document = await db_1.prisma.document.findUnique({
            where: { id: documentId },
            include: { shares: true },
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const comment = await db_1.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment || comment.documentId !== documentId) {
            return res.status(404).json({ error: "Comment not found" });
        }
        const isOwner = document.ownerId === userId;
        const isAuthor = comment.userId === userId;
        if (!isOwner && !isAuthor) {
            return res.status(403).json({ error: "Forbidden: Cannot update this comment" });
        }
        const updatedComment = await db_1.prisma.comment.update({
            where: { id: commentId },
            data: {
                isResolved: isResolved !== undefined ? isResolved : comment.isResolved,
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
// 4. Delete Own Comment
const deleteComment = async (req, res) => {
    try {
        const documentId = String(req.params.id);
        const commentId = String(req.params.commentId);
        const userId = req.user.id;
        const comment = await db_1.prisma.comment.findUnique({
            where: { id: commentId },
            include: { document: true },
        });
        if (!comment || comment.documentId !== documentId) {
            return res.status(404).json({ error: "Comment not found" });
        }
        const isOwner = comment.document.ownerId === userId;
        const isAuthor = comment.userId === userId;
        // Users can delete their own comments, or document owner can delete any comment
        if (!isAuthor && !isOwner) {
            return res.status(403).json({ error: "Forbidden: You can only delete your own comments" });
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
