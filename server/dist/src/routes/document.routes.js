"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const share_routes_1 = __importDefault(require("./share.routes"));
const comment_routes_1 = __importDefault(require("./comment.routes"));
const revision_routes_1 = __importDefault(require("./revision.routes"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const document_schema_1 = require("../validation/document.schema");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// Mount sub-routes
router.use("/:id/shares", share_routes_1.default);
router.use("/:id/comments", comment_routes_1.default);
router.use("/:id/revisions", revision_routes_1.default);
router.route("/")
    .get(document_controller_1.getDocuments)
    .post((0, validate_middleware_1.validateBody)(document_schema_1.createDocumentSchema), document_controller_1.createDocument);
router.route("/:id")
    .get(document_controller_1.getDocumentById)
    .patch((0, validate_middleware_1.validateBody)(document_schema_1.updateDocumentSchema), document_controller_1.updateDocument)
    .delete(document_controller_1.deleteDocument);
router.put("/:id/content", document_controller_1.updateDocumentContent);
router.post("/:id/duplicate", document_controller_1.duplicateDocument);
exports.default = router;
