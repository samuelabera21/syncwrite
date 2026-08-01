"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const revision_controller_1 = require("../controllers/revision.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.requireAuth);
router.route("/")
    .get(revision_controller_1.getRevisions)
    .post(revision_controller_1.createRevision);
router.post("/:revisionId/restore", revision_controller_1.restoreRevision);
exports.default = router;
