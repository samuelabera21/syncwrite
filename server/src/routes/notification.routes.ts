import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getNotifications, markAllAsRead, markAsRead } from "../controllers/notification.controller";

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
