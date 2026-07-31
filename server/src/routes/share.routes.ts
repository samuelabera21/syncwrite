import { Router } from "express";
import {
    getDocumentShares,
    shareDocument,
    updateShareRole,
    revokeShare,
} from "../controllers/share.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true }); // mergeParams so we can access :id from parent document router

router.use(requireAuth);

router.route("/")
    .get(getDocumentShares)
    .post(shareDocument);

router.route("/:shareId")
    .patch(updateShareRole)
    .delete(revokeShare);

export default router;