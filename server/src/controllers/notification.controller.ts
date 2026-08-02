import { Request, Response } from "express";
import { prisma } from "../config/db";

// 1. Get all notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

// 2. Mark a single notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const notificationId = req.params.id;
        
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        return res.status(200).json({ notification: updated });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ error: "Failed to mark as read" });
    }
};

// 3. Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({ error: "Failed to mark all as read" });
    }
};
