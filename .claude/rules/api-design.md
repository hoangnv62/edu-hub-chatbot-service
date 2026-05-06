---
description: Quy tắc thiết kế REST API
globs: ["src/routes/**/*.ts", "src/controllers/**/*.ts"]
---

# API Design Rules

## URL Convention
- Luôn prefix `/api/v1/`
- Resource dùng số nhiều: `/users`, `/orders`, `/products`
- Dùng `kebab-case`: `/user-profiles`, `/order-items`
- Nested resource hợp lý: `/users/:userId/orders` (tối đa 4 cấp)

## HTTP Methods & Status Codes
| Action            | Method | Success | Error         |
|-------------------|--------|---------|---------------|
| Lấy danh sách     | GET    | 200     | 400, 500      |
| Lấy một item      | GET    | 200     | 404           |
| Tạo mới           | POST   | 201     | 400, 422      |
| Cập nhật toàn bộ  | PUT    | 200     | 400, 404      |
| Cập nhật một phần | PATCH  | 200     | 400, 404      |
| Xóa               | DELETE | 204     | 404           |

## Response Helpers — `src/utils/responseHandler.ts`

Luôn dùng helper thay vì gọi `res.status().json()` thủ công:

```ts
import { Success } from '@/utils/responseHandler.js';

return Success(res, data);   // 200
```

Dùng `return` để dừng hàm ngay tại đó, tránh gửi response 2 lần:
```ts
if (!items.length) return Success(res, []);
const result = await this.service.process(items);
return Success(res, result);
```

## Error Handling

Throw exception — KHÔNG gọi `res.status()` thủ công cho lỗi:

```ts
import { NotFoundException, BadRequestException } from '@/utils/errors.js';

// ĐÚNG
throw new NotFoundException('User 42 not found');

// SAI
res.status(404).json({ error: 'NOT_FOUND', errorDescription: '...' });
```

`errorHandlerMiddleware` tự động bắt và trả đúng format:
```json
{ "error": "NOT_FOUND", "errorDescription": "User 42 not found" }
```

## Response Format — 4 kiểu

### 1. Lỗi (xử lý bởi errorHandlerMiddleware)
```json
{ "error": "NOT_FOUND", "errorDescription": "User 42 not found" }
```

### 2. Trả về một object
```ts
return Success(res, userDto);        // GET, PUT, PATCH → 200
res.status(201).json(createdDto);    // POST → 201 (chưa có Created helper)
```

### 3. Trả về danh sách (array trực tiếp)
```ts
return Success(res, items);
```

### 4. Trả về danh sách có phân trang
```ts
return Success(res, {
  data:         items,
  pageNumber:   page,
  pageSize:     limit,
  totalPage:    Math.ceil(total / limit),
  totalElement: total,
});
```

## TypeScript Types — `src/types/`
```ts
// src/types/response.ts
export interface PagedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPage: number;
  totalElement: number;
}
```

## Validation
- Dùng Zod schema để validate TRƯỚC khi vào controller
- Validate middleware trả `422` nếu fail:
  ```ts
  router.post('/', validate(createUserSchema), asyncHandler(userController.create));
  ```

## Pagination
- Mọi endpoint trả list lớn phải hỗ trợ `?page=1&limit=10`
- Default: `page=1`, `limit=10`, max `limit=100`
- Query pattern:
  ```ts
  const offset = (page - 1) * limit;
  // SELECT ... LIMIT ? OFFSET ?  →  [limit, offset]
  ```
