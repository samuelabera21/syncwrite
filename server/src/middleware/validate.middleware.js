"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => {
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
exports.validateBody = validateBody;
