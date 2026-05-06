import type { Request, Response, NextFunction } from 'express';
import { AppError, InternalServerErrorException } from '../utils/errors.js';

export const errorHandlerMiddleware = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.code, errorDescription: err.message });
        return;
    }
    const fallback = new InternalServerErrorException();
    res.status(fallback.statusCode).json({ error: fallback.code, errorDescription: fallback.message });
};
