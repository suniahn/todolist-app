require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const pool = require('../src/db/pool');

let userAId, userBId, tokenA, tokenB, defaultCategoryId;

beforeAll(async () => {
  const hash = await bcrypt.hash('Password1', 12);
  const ts = Date.now();

  const { rows: [userA] } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
    [`todo-a-${ts}@example.com`, hash, 'UserA']
  );
  const { rows: [userB] } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
    [`todo-b-${ts}@example.com`, hash, 'UserB']
  );
  userAId = userA.id;
  userBId = userB.id;
  tokenA = jwt.sign({ sub: userAId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  tokenB = jwt.sign({ sub: userBId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const { rows } = await pool.query('SELECT id FROM categories WHERE is_default = TRUE LIMIT 1');
  defaultCategoryId = rows[0].id;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'todo-a-%' OR email LIKE 'todo-b-%'");
  await pool.end();
});

function todoPayload(overrides = {}) {
  return {
    title: '테스트 할일',
    description: '설명',
    start_date: '2026-05-01',
    due_date: '2026-05-31',
    category_id: defaultCategoryId,
    ...overrides,
  };
}

describe('POST /api/v1/todos', () => {
  test('성공 → 201, todo 반환 (is_completed=false, completed_at=null)', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload());
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.is_completed).toBe(false);
    expect(res.body.completed_at).toBeNull();
    expect(res.body.user_id).toBe(userAId);
  });

  test('due_date < start_date → 400 TODO_INVALID_DATE', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ start_date: '2026-05-31', due_date: '2026-05-01' }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TODO_INVALID_DATE');
  });

  test('존재하지 않는 category_id → 404 CATEGORY_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ category_id: '00000000-0000-0000-0000-000000000000' }));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  test('title 없음 → 400 VALIDATION_ERROR', async () => {
    const { title, ...payload } = todoPayload();
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('AT 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/v1/todos').send(todoPayload());
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_UNAUTHORIZED');
  });
});

describe('GET /api/v1/todos', () => {
  let createdTodoId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ title: '목록조회용' }));
    createdTodoId = res.body.id;
  });

  test('성공 → 200, { todos, pagination }', async () => {
    const res = await request(app)
      .get('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todos');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
    expect(Array.isArray(res.body.todos)).toBe(true);
  });

  test('?category_id=... → 해당 카테고리 todo만 반환', async () => {
    const res = await request(app)
      .get(`/api/v1/todos?category_id=${defaultCategoryId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    res.body.todos.forEach((t) => expect(t.category_id).toBe(defaultCategoryId));
  });

  test('?is_completed=false → 미완료 todo만 반환', async () => {
    const res = await request(app)
      .get('/api/v1/todos?is_completed=false')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    res.body.todos.forEach((t) => expect(t.is_completed).toBe(false));
  });

  test('?schedule_status=overdue → due_date 지난 미완료 todo만 반환', async () => {
    // 과거 날짜로 todo 생성
    await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ title: '기간초과', start_date: '2024-01-01', due_date: '2024-01-31' }));

    const res = await request(app)
      .get('/api/v1/todos?schedule_status=overdue')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const today = new Date().toISOString().slice(0, 10);
    res.body.todos.forEach((t) => {
      expect(t.due_date < today).toBe(true);
      expect(t.is_completed).toBe(false);
    });
  });

  test('다른 사용자 todo는 포함되지 않음 (BR-03)', async () => {
    await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(todoPayload({ title: 'UserB 할일' }));

    const res = await request(app)
      .get('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`);
    res.body.todos.forEach((t) => expect(t.user_id).toBe(userAId));
  });
});

describe('GET /api/v1/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ title: '단건조회용' }));
    todoId = res.body.id;
  });

  test('성공 → 200, todo 반환', async () => {
    const res = await request(app)
      .get(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(todoId);
  });

  test('타인 todo 조회 → 403 TODO_FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TODO_FORBIDDEN');
  });

  test('존재하지 않는 id → 404 TODO_NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/v1/todos/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });
});

describe('PUT /api/v1/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ title: '수정용' }));
    todoId = res.body.id;
  });

  test('성공 → 200, 변경된 todo (updated_at 갱신)', async () => {
    const res = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '수정된 제목' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정된 제목');
    expect(res.body).toHaveProperty('updated_at');
  });

  test('타인 todo 수정 → 403 TODO_FORBIDDEN', async () => {
    const res = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: '해킹시도' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TODO_FORBIDDEN');
  });
});

describe('DELETE /api/v1/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(todoPayload({ title: '삭제용' }));
    todoId = res.body.id;
  });

  test('타인 todo 삭제 → 403 TODO_FORBIDDEN', async () => {
    const res = await request(app)
      .delete(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TODO_FORBIDDEN');
  });

  test('성공 → 204 No Content', async () => {
    const res = await request(app)
      .delete(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(204);
  });

  test('삭제 후 조회 → 404 TODO_NOT_FOUND', async () => {
    const res = await request(app)
      .get(`/api/v1/todos/${todoId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });
});
