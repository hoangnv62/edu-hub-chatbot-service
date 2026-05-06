---
description: Quy tắc TypeScript áp dụng cho toàn bộ src/**/*.ts
globs: ["src/**/*.ts"]
---

# TypeScript Rules

## Strict Mode
- Luôn bật `strict: true` trong `tsconfig.json`
- KHÔNG dùng `any` — dùng `unknown` nếu chưa xác định type
- Luôn khai báo return type cho function public
- Dùng `interface` cho object shape, `type` cho union/intersection

## Async/Await
- LUÔN dùng `async/await`, KHÔNG dùng `.then().catch()`
- Mọi async Express route handler phải được bọc bởi `asyncHandler`:
  ```ts
  router.get('/users', asyncHandler(userController.getAll));
  ```
- Xử lý lỗi tập trung tại `errorHandlerMiddleware`

## Imports
- Dùng absolute import với path alias (`@/services/user.service`)
- Không dùng `require()` — luôn dùng ES `import`
- Group imports: 1) Node built-ins, 2) Third-party, 3) Internal

## Request Types — `src/types/*.types.ts`

Gom Params/Body/Query vào 1 file, export type alias `*Request`:

```ts
// src/types/user.types.ts
import type { Request } from 'express';

export interface UserParams { id: string }
export interface UserBody   { name: string; email: string }
export interface UserQuery  { page?: string; limit?: string }

export type UserRequest = Request<UserParams, {}, UserBody, UserQuery>;
```

Controller dùng type alias — tránh viết generic dài:
```ts
// ĐÚNG
public getById = async (req: UserRequest, res: Response): Promise<Response> => { ... }

// SAI — dài, khó đọc
public getById = async (req: Request<UserParams, {}, UserBody, UserQuery>, ...) => { ... }
```

## Clean Code
- Mỗi function chỉ làm 1 việc, không dài quá ~40 dòng
- Tránh nested quá 3 cấp — extract function hoặc dùng early return
- Không hardcode URL, config, magic number — dùng biến môi trường hoặc constant
- Không swallow error (`catch (e) {}`) — luôn handle hoặc rethrow

## Ví dụ chuẩn — Controller
```ts
import type { Response } from 'express';
import type { UserRequest } from '@/types/user.types.js';
import { Success } from '@/utils/responseHandler.js';
import { UserService } from '@/services/user.service.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getById = async (req: UserRequest, res: Response): Promise<Response> => {
    const user = await this.userService.findById(Number(req.params.id));
    return Success(res, user);
  };
}
```

## Ví dụ chuẩn — Service
```ts
import { UserRepository } from '@/repositories/user.repository.js';
import { NotFoundException } from '@/utils/errors.js';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async findById(id: number): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```
