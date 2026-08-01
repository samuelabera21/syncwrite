"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true }); // mergeParams to access :id from parent document router
router.use(auth_middleware_1.requireAuth);
router.route("/")
    .get(comment_controller_1.getComments)
    .post(comment_controller_1.createComment);
router.route("/:commentId")
    .patch(comment_controller_1.updateComment)
    .delete(comment_controller_1.deleteComment);
exports.default = router;
