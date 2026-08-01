export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(
        statusCode: number,
        code: string,
        message: string,
    ) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}