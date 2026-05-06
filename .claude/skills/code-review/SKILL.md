---
name: code-review
description: Review code Express/TypeScript toàn diện — architecture, security, performance, testing
---

# Skill: Code Review

## Khi nào dùng
Khi user nói: "review code", "check PR", "có vấn đề gì không", "xem lại file này"

## Review Checklist

### Layer Architecture
- Route: chỉ define path + middleware + handler, không có logic
- Controller: nhận req → gọi service → trả res. Không gọi `pool` trực tiếp
- Service: business logic thuần túy, không biết về HTTP, không import `pool`
- Repository: toàn bộ SQL query ở đây, dùng `pool` từ `src/db/connection.ts`

### TypeScript
- Không có `any` (kể cả implicit)
- Async function không thiếu `await`
- Return type được khai báo cho function public

### SQL & Database (mysql2)
- Không có string concat để build SQL — phải dùng `?` hoặc `:name`
- Named placeholder dùng khi INSERT/UPDATE nhiều cột
- Map snake_case DB row → camelCase DTO trong repository trước khi return
- Không gọi `pool` bên ngoài repository

### Response Format
- Lỗi trả `{ error, errorDescription }` — không trả message thô hoặc stack trace
- GET list nhỏ → array trực tiếp `[]`
- GET/POST/PUT/PATCH một object → object trực tiếp `{}`
- GET list có phân trang → `{ data, pageNumber, pageSize, totalPage, totalElement }`
- DELETE → 204 no body

### Error Handling
- `asyncHandler` bọc tất cả async route handler
- Service throw `AppError` subclass (NotFoundException, ConflictException...)
- `errorHandlerMiddleware` middleware được đăng ký cuối cùng trong `app.ts`
- Không để lỗi DB (MySQL error code) leak ra client

### Security
- Zod validate input trước controller
- Auth middleware bảo vệ route cần đăng nhập
- Không log password, token, PII
- Không `any` trong Zod schema

### Performance
- List endpoint có pagination (`LIMIT ? OFFSET ?`)
- Không có N+1: không gọi DB trong vòng lặp
- `SELECT *` không được dùng — select cột cụ thể

### Testing
- Có test cho logic mới
- Mock repository trong service test (không mock pool trực tiếp)

## Output Format
```
## Review: [file hoặc feature]

🔴 Critical — [mô tả + fix cụ thể]
🟡 Warning  — [mô tả + suggestion]
🟢 Tip      — [optional improvement]

Điểm: X/10
```
