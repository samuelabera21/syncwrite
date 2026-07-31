import { Router } from "express";
import {
    getRevisions,
    createRevision,
    restoreRevision,
} from "../controllers/revision.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.route("/")
    .get(getRevisions)
    .post(createRevision);

router.post("/:revisionId/restore", restoreRevision);

export default router;