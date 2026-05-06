# Code Review — Express.js / TypeScript

Review code theo checklist dưới đây và trả kết quả theo format chuẩn.

## Checklist

### Architecture
- [ ] Route file chỉ định nghĩa route, không có logic?
- [ ] Controller không gọi `pool` / DB trực tiếp?
- [ ] Service không import gì từ `express` (Request/Response)?
- [ ] Repository là nơi duy nhất chứa SQL query (mysql2)?

### TypeScript
- [ ] Có dùng `any` không? (Không được phép)
- [ ] Return type của function public có được khai báo không?
- [ ] Tất cả async function có `await` đúng chỗ không?

### SQL & Database
- [ ] SQL được build bằng placeholder (`?` hoặc `:name`), không concat string?
- [ ] snake_case DB row đã được map sang camelCase DTO trong repository?
- [ ] Có N+1 không? (gọi DB trong vòng lặp)
- [ ] List query có `LIMIT ? OFFSET ?`?
- [ ] Không dùng `SELECT *` — select cột cụ thể?

### Error Handling
- [ ] Tất cả async route handler đã được bọc `asyncHandler`?
- [ ] Lỗi DB (MySQL error code) đã được catch và map sang `AppError`?
- [ ] HTTP status code có đúng với từng loại lỗi không?

### Response Format
- [ ] Lỗi trả `{ error, errorDescription }` — không để stack trace lộ ra?
- [ ] GET/POST/PUT/PATCH một object → payload trực tiếp?
- [ ] GET list nhỏ → array trực tiếp?
- [ ] GET list lớn → `{ data, pageNumber, pageSize, totalPage, totalElement }`?
- [ ] DELETE → 204 no body?

### Security
- [ ] Input có được validate bằng Zod trước khi xử lý?
- [ ] JWT token có được verify đúng cách không?
- [ ] Sensitive data (password, token) không bị trả về trong response?

### Testing
- [ ] Logic mới có unit test không?
- [ ] Happy path và error case được cover?

## Output format
```
## Kết quả Review: [tên file/feature]

### 🔴 Critical
- [issue] — [giải thích + cách fix]

### 🟡 Warning
- [issue] — [giải thích]

### 🟢 Suggestion
- [improvement]

### ✅ Điểm tổng: X/10
```

$ARGUMENTS