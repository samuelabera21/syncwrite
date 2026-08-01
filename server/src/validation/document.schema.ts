import { z } from "zod";

export const createDocumentSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be 200 characters or fewer")
        .optional(),
});

export const updateDocumentSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be 200 characters or fewer"),
});