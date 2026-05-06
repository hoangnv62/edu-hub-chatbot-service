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
- Xử lý lỗi tập trung tại `errorHandlerMiddleware` middleware

## Imports
- Dùng absolute import với path alias (`@/services/userService`)
- Không dùng `require()` — luôn dùng ES `import`
- Group imports: 1) Node built-ins, 2) Third-party, 3) Internal

## Clean Code
- Mỗi function chỉ làm 1 việc, không dài quá ~40 dòng
- Tránh nested quá 3 cấp — extract function hoặc dùng early return
- Không hardcode URL, config, magic number — dùng biến môi trường hoặc constant
- Không swallow error (`catch (e) {}`) — luôn handle hoặc rethrow

## Ví dụ chuẩn — Controller
```ts
import { Request, Response } from 'express';
import { UserService } from '@/services/userService';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.findById(Number(req.params.id));
    res.json(user); // payload trực tiếp, không wrap
  };
}
```

## Ví dụ chuẩn — Service
```ts
import { UserRepository } from '@/repositories/userRepository';
import { NotFoundException } from '@/utils/errors';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async findById(id: number): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```
