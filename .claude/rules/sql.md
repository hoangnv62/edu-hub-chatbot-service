---
description: Quy tắc viết SQL với mysql2/promise — MariaDB
globs: ["src/repositories/**/*.ts", "src/db/**/*.ts"]
---

# SQL Rules — mysql2/promise

## Bắt buộc dùng placeholder, KHÔNG concat string

```ts
// ĐÚNG
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

// SAI — SQL Injection risk
const [rows] = await pool.query(`SELECT * FROM users WHERE id = ${id}`);
```

## Chọn kiểu placeholder

| Tình huống | Dùng |
|---|---|
| SELECT với 1–2 điều kiện | `?` positional |
| INSERT / UPDATE nhiều cột | `:name` named |
| Tham số xuất hiện nhiều lần | `:name` named |
| WHERE động (optional filter) | `?` với array push |

## Named placeholder (cần `namedPlaceholders: true` trong pool config)

```ts
await pool.query<ResultSetHeader>(
  'INSERT INTO users (name, email, role) VALUES (:name, :email, :role)',
  { name, email, role }
);
```

## Dynamic WHERE

```ts
const conditions: string[] = ['is_active = ?'];
const params: unknown[]    = [true];

if (search) {
  conditions.push('name LIKE ?');
  params.push(`%${search}%`);
}

const sql = `SELECT * FROM users WHERE ${conditions.join(' AND ')} LIMIT ? OFFSET ?`;
params.push(limit, offset);
```

## Lấy kết quả đúng type

```ts
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// SELECT
const [rows] = await pool.query<RowDataPacket[]>('SELECT ...', [...]);

// INSERT / UPDATE / DELETE
const [result] = await pool.query<ResultSetHeader>('...', {...});
const newId    = result.insertId;
const affected = result.affectedRows;
```

## Transaction

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

## Map snake_case → camelCase trong repository

```ts
// Không để snake_case leak ra ngoài repositories
function toUserDto(row: RowDataPacket): UserDto {
  return {
    id:        row.id,
    fullName:  row.full_name,
    createdAt: row.created_at,
    isActive:  row.is_active,
  };
}
```

## Đếm tổng cho phân trang

```ts
const [[{ total }]] = await pool.query<RowDataPacket[]>(
  'SELECT COUNT(*) AS total FROM users WHERE is_active = ?',
  [true]
);
```
