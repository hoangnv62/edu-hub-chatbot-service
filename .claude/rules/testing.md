---
description: Quy tắc viết test áp dụng cho tests/
globs: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"]
---

# Testing Rules

## Phân loại test
- **Unit test** (`tests/unit/`): Test service và utility — mock hoàn toàn dependency
- **Integration test** (`tests/integration/`): Test route + controller dùng Supertest + DB test thật (SQLite in-memory hoặc Docker)

## Naming convention
- File: `userService.test.ts`, `userRoutes.test.ts`
- Test case: `describe('UserService')` → `it('should throw NotFoundException when user not found')`

## Unit Test mẫu
```ts
import { UserService } from '@/services/userService';
import { UserRepository } from '@/repositories/userRepository';

jest.mock('@/repositories/userRepository');

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = new UserRepository() as jest.Mocked<UserRepository>;
    service = new UserService(mockRepo);
  });

  it('should throw NotFoundException when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById(999)).rejects.toThrow('not found');
  });
});
```

## Integration Test mẫu (Supertest)
```ts
import request from 'supertest';
import app from '@/app';

describe('GET /api/v1/users/:id', () => {
  it('200 — trả object trực tiếp', async () => {
    const res = await request(app).get('/api/v1/users/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('404 — trả { error, errorDescription }', async () => {
    const res = await request(app).get('/api/v1/users/999999');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error:            expect.any(String),
      errorDescription: expect.any(String),
    });
  });
});
```

## Điều KHÔNG được làm
- Không gọi API thật bên ngoài trong unit test
- Không dùng `setTimeout` — dùng `jest.useFakeTimers()`
- Không share state giữa các test case — dùng `beforeEach` để reset