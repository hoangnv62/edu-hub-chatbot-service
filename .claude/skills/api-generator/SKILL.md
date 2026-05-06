---
name: api-generator
description: Tự động scaffold CRUD API hoàn chỉnh từ mô tả — Zod schema, Repository, Service, Controller, Routes, Test
---

# Skill: API Generator

## Khi nào dùng
Khi user nói: "tạo API cho [resource]", "generate CRUD [entity]", "làm endpoint [feature]"

## Quy trình

### Bước 1 — Phân tích
Xác định từ yêu cầu:
- Tên resource (số ít, PascalCase): `User`, `Product`, `Order`
- Fields và types
- Relations với bảng khác
- Endpoint nào cần (full CRUD hay một phần)
- Route nào cần auth

### Bước 2 — Tạo file theo thứ tự

```
src/schemas/xxxSchema.ts         ← Zod validation schemas
src/repositories/xxxRepo.ts      ← Raw SQL queries (mysql2)
src/services/xxxService.ts       ← Business logic
src/controllers/xxxController.ts ← HTTP layer
src/routes/xxxRoutes.ts          ← Route definitions
src/app.ts                       ← Đăng ký route mới
tests/unit/xxxService.test.ts    ← Unit tests
```

In ra SQL tạo bảng (nếu cần) để developer chạy thủ công — KHÔNG tự chạy migration.

### Bước 3 — Verify
```bash
npm run lint:fix
npm test -- xxxService.test.ts
```

## Templates chuẩn

### Response Types
```ts
// src/types/response.ts
export interface ErrorResponse {
  error: string;
  errorDescription: string;
}

export interface PagedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPage: number;
  totalElement: number;
}
```

### asyncHandler utility
```ts
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

### AppError class
```ts
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class NotFoundException extends AppError {
  constructor(message = 'Not found') { super(404, message, 'NOT_FOUND'); }
}
export class ConflictException extends AppError {
  constructor(message = 'Conflict') { super(409, message, 'CONFLICT'); }
}
export class UnauthorizedException extends AppError {
  constructor(message = 'Unauthorized') { super(401, message, 'UNAUTHORIZED'); }
}
export class TokenExpiredException extends AppError {
  constructor(message = 'Token has expired') { super(401, message, 'TOKEN_EXPIRED'); }
}
export class ForbiddenException extends AppError {
  constructor(message = 'Forbidden') { super(403, message, 'FORBIDDEN'); }
}
```

### validate middleware
```ts
// src/middlewares/validate.ts
import { AnyZodObject, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({ error: 'VALIDATION_ERROR', errorDescription: err.errors[0]?.message ?? 'Validation failed' });
      } else {
        next(err);
      }
    }
  };
```

### Repository template (mysql2)
```ts
// src/repositories/userRepository.ts
import { pool } from '@/db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserRepository {
  async findAll({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;
    const [[{ total }], [rows]] = await Promise.all([
      pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM users WHERE is_active = ?', [true]),
      pool.query<RowDataPacket[]>('SELECT * FROM users WHERE is_active = ? LIMIT ? OFFSET ?', [true, limit, offset]),
    ]) as [[RowDataPacket[], unknown], [RowDataPacket[], unknown]];
    return { items: (rows as RowDataPacket[]).map(toUserDto), total: Number((total as RowDataPacket[])[0].total) };
  }

  async findById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? AND is_active = ?', [id, true]
    );
    return rows[0] ? toUserDto(rows[0]) : null;
  }

  async create(data: CreateUserDto) {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password, role) VALUES (:fullName, :email, :password, :role)',
      { fullName: data.fullName, email: data.email, password: data.password, role: data.role ?? 'user' }
    );
    return this.findById(result.insertId) as Promise<UserDto>;
  }
}

function toUserDto(row: RowDataPacket): UserDto {
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role, createdAt: row.created_at };
}
```

### Controller template — 4 kiểu response
```ts
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET list có phân trang
  getAll = async (req: Request, res: Response): Promise<void> => {
    const page  = Number(req.query.page)  || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const { items, total } = await this.userService.findAll({ page, limit });
    res.json({ data: items, pageNumber: page, pageSize: limit, totalPage: Math.ceil(total / limit), totalElement: total });
  };

  // GET one → object trực tiếp
  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.findById(Number(req.params.id));
    res.json(user);
  };

  // POST → 201 + object trực tiếp
  create = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.create(req.body);
    res.status(201).json(user);
  };

  // DELETE → 204 no body
  remove = async (req: Request, res: Response): Promise<void> => {
    await this.userService.delete(Number(req.params.id));
    res.status(204).send();
  };
}
```

### errorHandlerMiddleware middleware
```ts
// src/middlewares/errorHandlerMiddleware.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors.js';

export const errorHandlerMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.code, errorDescription: err.message });
    return;
  }
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', errorDescription: 'An unexpected error occurred' });
};
```
