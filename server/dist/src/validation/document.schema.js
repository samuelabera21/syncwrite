"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createDocumentSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be 200 characters or fewer")
        .optional(),
});
exports.updateDocumentSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be 200 characters or fewer"),
});
