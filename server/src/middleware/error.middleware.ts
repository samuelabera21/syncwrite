import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/app-error";

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    console.error(`[${req.method} ${req.originalUrl}]`, error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
            },
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return res.status(404).json({
                error: {
                    code: "RESOURCE_NOT_FOUND",
                    message: "The requested resource was not found",
                },
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                error: {
                    code: "RESOURCE_ALREADY_EXISTS",
                    message: "A resource with the same unique value already exists",
                },
            });
        }

        return res.status(400).json({
            error: {
                code: "DATABASE_ERROR",
                message: "The database operation could not be completed",
            },
        });
    }

    return res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
        },
    });
};