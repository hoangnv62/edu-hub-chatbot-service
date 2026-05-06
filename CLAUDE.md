# Project Context

## Tech Stack
- **Runtime:** Node.js 20+ (LTS)
- **Framework:** Express.js 5.x
- **Language:** TypeScript 5.x
- **Database:** MariaDB — driver `mysql2/promise` (không dùng ORM)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** Zod
- **Testing:** Jest + Supertest
- **Logging:** Winston
- **Docs:** Swagger (swagger-jsdoc + swagger-ui-express)

## Cấu trúc thư mục
```
src/
  app.ts                # Express app setup (không chứa server listen)
  server.ts             # Entry point — chỉ gọi app.listen()
  db/
    connection.ts       # Tạo mysql2 pool, export pool
    index.ts            # Re-export tiện dùng
  routes/               # Định nghĩa routes
  controllers/          # Xử lý request/response
  services/             # Business logic
  repositories/         # Raw SQL queries (mysql2) — tầng duy nhất chạm DB
  middlewares/          # auth, validate, errorHandlerMiddleware, ...
  schemas/              # Zod schemas (validation)
  types/                # TypeScript types & interfaces
  utils/                # asyncHandler, errors, ...
  config/               # Env config, constants
tests/
  unit/                 # Jest unit tests (mock pool)
  integration/          # Supertest + DB thật (test DB riêng)
```

## Lệnh hay dùng
```bash
npm run dev             # Dev server (ts-node-dev)
npm run build           # Compile TypeScript → dist/
npm start               # Chạy production
npm test                # Chạy toàn bộ test
npm run test:watch      # Watch mode
npm run lint            # ESLint
npm run lint:fix        # Auto-fix lint errors
```

## Database — mysql2 với hai kiểu placeholder

### Setup pool (db/connection.ts)
```ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  namedPlaceholders:  true,
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           '+07:00',
});
````

### Positional placeholder `?`
Dùng khi query đơn giản, ít tham số:
```ts
const [rows] = await pool.query<RowDataPacket[]>(
  'SELECT * FROM users WHERE id = ? AND is_active = ?',
  [id, true]
);
```

### Named placeholder `:name`
Dùng khi INSERT/UPDATE nhiều cột hoặc tham số lặp lại:
```ts
const [result] = await pool.query<ResultSetHeader>(
  `INSERT INTO users (name, email, password, role)
   VALUES (:name, :email, :password, :role)`,
  { name, email, password: hashedPassword, role: 'user' }
);
```

### Quy tắc chọn kiểu
| Tình huống | Dùng |
|---|---|
| SELECT với 1–2 điều kiện | `?` |
| INSERT / UPDATE nhiều cột | `:name` |
| Tham số xuất hiện nhiều lần | `:name` |
| Build WHERE động (optional filter) | `?` với array push |

### Lấy kết quả đúng type
```ts
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// SELECT
const [rows] = await pool.query<RowDataPacket[]>('SELECT ...', [...]);

// INSERT / UPDATE / DELETE
const [result] = await pool.query<ResultSetHeader>('INSERT ...', {...});
const newId    = result.insertId;
const affected = result.affectedRows;
```

### Transaction
```ts
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  await conn.query('INSERT INTO orders ...', { ... });
  await conn.query('UPDATE inventory SET stock = stock - ? WHERE id = ?', [qty, itemId]);
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

## Response Format

### Lỗi
```json
{ "error": "NOT_FOUND", "errorDescription": "User not found" }
```

### Trả về một object
```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

### Trả về danh sách
```json
[{ "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" }]
```

### Trả về danh sách có phân trang
```json
{
  "data": [{ "id": 1, "name": "Alice" }],
  "pageNumber": 1,
  "pageSize": 10,
  "totalPage": 5,
  "totalElement": 48
}
```

> Không có wrapper `{ success, message, data }` — response trả thẳng payload.

## Conventions bắt buộc

### Đặt tên
- File: `snake_case.folder_parent.ts` — `user.service.ts`, `auth.middleware.ts`
- Class: `PascalCase` — `UserRepository`
- Interface/Type: `PascalCase` — `UserRow`, `PagedResponse<T>`
- Constant: `UPPER_SNAKE_CASE` — `JWT_EXPIRES_IN`
- Route: `kebab-case` — `/api/v1/user-profiles`
- Cột DB: `snake_case` — `created_at`, `is_active`

### API Design
- Prefix tất cả routes: `/api/v1/`
- Validate input bằng Zod TRƯỚC khi vào controller
- HTTP status code đúng nghĩa: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `422`, `500`

### Code
- Luôn dùng `async/await`, KHÔNG callback
- Async route handler bắt buộc dùng `asyncHandler`
- Controller không gọi `pool` trực tiếp — chỉ qua repository
- Map DB row (snake_case) → DTO (camelCase) trong repository
- Dùng `winston` để log, KHÔNG `console.log`

## Những điều KHÔNG được làm
- Không commit `.env` lên git
- Không để `any` trong TypeScript
- Không string-concatenate để build SQL — luôn dùng placeholder
- Không query DB trong controller hay service
- Không bỏ qua `await`
