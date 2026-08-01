"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const share_controller_1 = require("../controllers/share.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true }); // mergeParams so we can access :id from parent document router
router.use(auth_middleware_1.requireAuth);
router.route("/")
    .get(share_controller_1.getDocumentShares)
    .post(share_controller_1.shareDocument);
router.route("/:shareId")
    .patch(share_controller_1.updateShareRole)
    .delete(share_controller_1.revokeShare);
exports.default = router;
