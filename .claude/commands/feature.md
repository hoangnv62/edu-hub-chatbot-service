# Tạo Feature Mới

Tạo đầy đủ code cho feature: **$ARGUMENTS**

## Các file cần tạo (theo đúng thứ tự)

### 1. Zod Schema — `src/schemas/xxxSchema.ts`
- `createXxxSchema` — validate POST body
- `updateXxxSchema` — validate PATCH body
- Export TypeScript type từ schema

### 2. Repository — `src/repositories/xxxRepository.ts`
- CRUD cơ bản: `findAll`, `findById`, `create`, `update`, `delete`
- Chỉ dùng `pool` từ `src/db/connection.ts` ở đây
- Map snake_case DB row → camelCase DTO trước khi return
- Các method trả list lớn phải nhận `{ page, limit }` và trả `{ items, total }`

```ts
import { pool } from '@/db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class XxxRepository {
  async findById(id: number): Promise<XxxDto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM xxxs WHERE id = ? AND is_active = ?',
      [id, true]
    );
    return rows[0] ? toXxxDto(rows[0]) : null;
  }

  async create(data: CreateXxxDto): Promise<XxxDto> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO xxxs (col_a, col_b) VALUES (:colA, :colB)',
      { colA: data.colA, colB: data.colB }
    );
    return this.findById(result.insertId) as Promise<XxxDto>;
  }
}
```

### 3. Service — `src/services/xxxService.ts`
- Business logic, gọi repository
- Throw `NotFoundException`, `ConflictException` khi cần

### 4. Controller — `src/controllers/xxxController.ts`
- Nhận request, gọi service, trả response theo đúng 4 kiểu format
- GET one / POST / PUT / PATCH → trả object trực tiếp
- GET list nhỏ → trả array trực tiếp
- GET list có phân trang → trả `{ data, pageNumber, pageSize, totalPage, totalElement }`

```ts
getAll = async (req: Request, res: Response): Promise<void> => {
  const page  = Number(req.query.page)  || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const { items, total } = await this.xxxService.findAll({ page, limit });
  res.json({
    data:         items,
    pageNumber:   page,
    pageSize:     limit,
    totalPage:    Math.ceil(total / limit),
    totalElement: total,
  });
};
```

### 5. Routes — `src/routes/xxxRoutes.ts`
- Định nghĩa endpoints
- Gắn `validate(schema)` middleware trước controller
- Gắn `authenticate` middleware cho route cần auth

### 6. Đăng ký route trong `src/app.ts`
```ts
import xxxRoutes from '@/routes/xxxRoutes';
app.use('/api/v1/xxxs', xxxRoutes);
```

### 7. Test — `tests/unit/xxxService.test.ts`
- Mock repository
- Test: happy path, not found, validation error

## Lưu ý migration
Nếu cần bảng mới, in ra SQL tạo bảng để developer chạy thủ công — KHÔNG tự chạy câu lệnh SQL trên DB.

## Sau khi tạo xong
```bash
npm run lint:fix   # Fix lint
npm test           # Verify không có lỗi
```
