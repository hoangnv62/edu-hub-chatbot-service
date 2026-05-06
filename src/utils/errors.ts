export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;

function deriveCode(className: string): string {
    return className
        .replace('Exception', '')
        .replace(/([A-Z])/g, '_$1')
        .replace(/^_/, '')
        .toUpperCase();
}

export class AppError extends Error {
    readonly code: string;

    constructor(
        public readonly statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = deriveCode(this.name);
    }
}

export class NotFoundException extends AppError {
    constructor(message = 'Not found') {
        super(HttpStatus.NOT_FOUND, message);
    }
}

export class ConflictException extends AppError {
    constructor(message = 'Conflict') {
        super(HttpStatus.CONFLICT, message);
    }
}

export class UnauthorizedException extends AppError {
    constructor(message = 'Unauthorized') {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}

export class TokenExpiredException extends AppError {
    constructor(message = 'Token has expired') {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}

export class ForbiddenException extends AppError {
    constructor(message = 'Forbidden') {
        super(HttpStatus.FORBIDDEN, message);
    }
}

export class InternalServerErrorException extends AppError {
    constructor(message = 'An unexpected error occurred') {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}

export class BadRequestException extends AppError {
    constructor(message = 'Bad request') {
        super(HttpStatus.BAD_REQUEST, message);
    }
}