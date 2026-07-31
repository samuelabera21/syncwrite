import { Router } from "express";
import {
    getComments,
    createComment,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true }); // mergeParams to access :id from parent document router

router.use(requireAuth);

router.route("/")
    .get(getComments)
    .post(createComment);

router.route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;