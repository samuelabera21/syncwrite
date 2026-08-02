"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const db_1 = require("../config/db");
// 1. Get all notifications for the authenticated user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const notifications = await db_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unreadCount = await db_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return res.status(200).json({ notifications, unreadCount });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
};
exports.getNotifications = getNotifications;
// 2. Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const notificationId = req.params.id;
        const notification = await db_1.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: "Notification not found" });
        }
        const updated = await db_1.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return res.status(200).json({ notification: updated });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ error: "Failed to mark as read" });
    }
};
exports.markAsRead = markAsRead;
// 3. Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        await db_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({ error: "Failed to mark all as read" });
    }
};
exports.markAllAsRead = markAllAsRead;
