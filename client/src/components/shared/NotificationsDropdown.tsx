import React, { useState, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";

interface Notification {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.isRead) markAsRead(n.id);
        if (n.link) {
            window.location.href = n.link;
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                className="relative text-slate-600 hover:text-slate-900 focus:ring-0"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-xl">
                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-slate-500">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`relative cursor-pointer flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                                                !n.isRead ? "bg-indigo-50/30" : ""
                                            }`}
                                        >
                                            {!n.isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                            )}
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <p className={`text-sm ${!n.isRead ? "font-medium text-slate-900" : "text-slate-600"}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!n.isRead && (
                                                <button
                                                    onClick={(e) => markAsRead(n.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 self-center transition-opacity"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
