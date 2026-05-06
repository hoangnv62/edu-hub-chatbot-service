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

## Response Format — 4 kiểu

### 1. Lỗi
```json
{ "error": "NOT_FOUND", "errorDescription": "User 42 not found" }
```
```ts
res.status(404).json({ error: 'NOT_FOUND', errorDescription: 'User 42 not found' });
```

### 2. Trả về một object (payload trực tiếp)
```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```
```ts
res.status(200).json(userDto);        // GET, PUT, PATCH
res.status(201).json(createdDto);     // POST
```

### 3. Trả về danh sách (array trực tiếp)
```json
[{ "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" }]
```
```ts
res.status(200).json(items);
```
Dùng khi list nhỏ, không cần phân trang (dropdown, lookup).

### 4. Trả về danh sách có phân trang
```json
{
  "data": [{ "id": 1, "name": "Alice" }],
  "pageNumber": 1,
  "pageSize": 10,
  "totalPage": 5,
  "totalElement": 48
}
```
```ts
res.status(200).json({
  data:         items,
  pageNumber:   page,
  pageSize:     limit,
  totalPage:    Math.ceil(total / limit),
  totalElement: total,
});
```

## TypeScript Types
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