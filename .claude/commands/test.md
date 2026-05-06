# Viết Test

Viết test cho: **$ARGUMENTS**

## Unit Test — `tests/unit/xxxService.test.ts`

Mock repository, test service logic:

```ts
import { XxxService } from '@/services/xxxService';
import { XxxRepository } from '@/repositories/xxxRepository';
import { NotFoundException } from '@/utils/errors';

jest.mock('@/repositories/xxxRepository');

describe('XxxService', () => {
  let service: XxxService;
  let mockRepo: jest.Mocked<XxxRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = new XxxRepository() as jest.Mocked<XxxRepository>;
    service  = new XxxService(mockRepo);
  });

  describe('findById', () => {
    it('should return dto when found', async () => {
      mockRepo.findById.mockResolvedValue({ id: 1, name: 'Alice' });
      const result = await service.findById(1);
      expect(result).toEqual({ id: 1, name: 'Alice' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 1, email: 'alice@example.com' });
      await expect(service.create({ email: 'alice@example.com' })).rejects.toThrow('already exists');
    });
  });
});
```

## Integration Test — `tests/integration/xxxRoutes.test.ts`

Test route + controller qua Supertest, không mock DB (dùng test DB):

```ts
import request from 'supertest';
import app from '@/app';

describe('GET /api/v1/xxxs/:id', () => {
  it('200 — returns object directly', async () => {
    const res = await request(app).get('/api/v1/xxxs/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('404 — returns error object', async () => {
    const res = await request(app).get('/api/v1/xxxs/999999');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'NOT_FOUND', errorDescription: expect.any(String) });
  });
});

describe('GET /api/v1/xxxs', () => {
  it('200 — returns paged response', async () => {
    const res = await request(app).get('/api/v1/xxxs?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data:         expect.any(Array),
      pageNumber:   1,
      pageSize:     10,
      totalPage:    expect.any(Number),
      totalElement: expect.any(Number),
    });
  });
});

describe('POST /api/v1/xxxs', () => {
  it('422 — validation error', async () => {
    const res = await request(app).post('/api/v1/xxxs').send({});
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });

  it('201 — created object returned directly', async () => {
    const res = await request(app).post('/api/v1/xxxs').send({ name: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Test' });
  });
});
```

## Sau khi viết
```bash
npm test -- --testPathPattern=xxx
npm run lint:fix
```
