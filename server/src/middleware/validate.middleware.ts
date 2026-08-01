import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateBody = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Request validation failed",
                    details: result.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
            });
        }

        req.body = result.data;
        next();
    };
};