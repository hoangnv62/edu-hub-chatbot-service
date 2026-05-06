# Database Migration

$ARGUMENTS

## Quy trình tạo migration

1. Tạo file SQL trong `src/db/migrations/` đặt tên theo format:
   `YYYYMMDD_HHMMSS_<tên mô tả>.sql`
   Ví dụ: `20250505_143000_create_users_table.sql`

2. Viết SQL migration:
```sql
-- Up
CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  full_name  VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Down (để rollback thủ công nếu cần)
-- DROP TABLE IF EXISTS users;
```

3. Thực thi migration:
```bash
# Chạy thủ công qua MySQL client hoặc script
mysql -u $DB_USER -p $DB_NAME < src/db/migrations/20250505_143000_create_users_table.sql
```

4. Cập nhật TypeScript type trong `src/types/` nếu có thay đổi schema

## Rollback
- Dev: chạy phần `-- Down` của migration file thủ công
- Production: tạo migration mới đảo ngược thay vì xóa migration cũ

## Convention cho MariaDB
- Engine: `InnoDB`
- Charset: `utf8mb4`, Collation: `utf8mb4_unicode_ci`
- Tên cột: `snake_case`
- Mọi bảng cần có: `created_at`, `updated_at`
- Soft delete: dùng cột `is_active TINYINT(1)` thay vì `deleted_at`

## Lưu ý
- KHÔNG xóa hoặc sửa migration file đã được commit
- KHÔNG tự động chạy migration — luôn để developer xác nhận trước
- Luôn test migration trên dev DB trước khi deploy production
