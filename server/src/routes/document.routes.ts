import { Router } from "express";
import {
    getDocuments,
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument,
    duplicateDocument,
} from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth.middleware";
import shareRoutes from "./share.routes";
import commentRoutes from "./comment.routes";
import revisionRoutes from "./revision.routes";

const router = Router();

router.use(requireAuth);

// Canonical sub-routes
router.use("/:id/shares", shareRoutes);
router.use("/:id/share", shareRoutes); // Alias for compatibility
router.use("/:id/comments", commentRoutes);
router.use("/:id/revisions", revisionRoutes);

router.route("/")
    .get(getDocuments)
    .post(createDocument);

router.post("/:id/duplicate", duplicateDocument);

router.route("/:id")
    .get(getDocumentById)
    .patch(updateDocument)
    .delete(deleteDocument);

export default router;