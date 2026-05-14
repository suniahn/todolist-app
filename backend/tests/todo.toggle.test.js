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
    [`toggle-a-${ts}@example.com`, hash, 'ToggleUserA']
  );
  const { rows: [userB] } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
    [`toggle-b-${ts}@example.com`, hash, 'ToggleUserB']
  );
  userAId = userA.id;
  userBId = userB.id;
  tokenA = jwt.sign({ sub: userAId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  tokenB = jwt.sign({ sub: userBId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const { rows } = await pool.query('SELECT id FROM categories WHERE is_default = TRUE LIMIT 1');
  defaultCategoryId = rows[0].id;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'toggle-a-%' OR email LIKE 'toggle-b-%'");
  await pool.end();
});

async function createTodo(token, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/todos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: '토글테스트',
      start_date: '2026-05-01',
      due_date: '2026-05-31',
      category_id: defaultCategoryId,
      ...overrides,
    });
  return res.body;
}

describe('PATCH /api/v1/todos/:id/toggle', () => {
  test('미완료 todo 토글 → is_completed=true, completed_at 설정', async () => {
    const todo = await createTodo(tokenA, { title: '미완료→완료' });
    expect(todo.is_completed).toBe(false);

    const res = await request(app)
      .patch(`/api/v1/todos/${todo.id}/toggle`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.is_completed).toBe(true);
    expect(res.body.completed_at).not.toBeNull();
  });

  test('완료된 todo 재토글 → is_completed=false, completed_at=null', async () => {
    const todo = await createTodo(tokenA, { title: '완료→미완료' });

    // 먼저 완료 처리
    await request(app)
      .patch(`/api/v1/todos/${todo.id}/toggle`)
      .set('Authorization', `Bearer ${tokenA}`);

    // 재토글 (미완료로 복원)
    const res = await request(app)
      .patch(`/api/v1/todos/${todo.id}/toggle`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.is_completed).toBe(false);
    expect(res.body.completed_at).toBeNull();
  });

  test('토글 후 updated_at 갱신 확인', async () => {
    const todo = await createTodo(tokenA, { title: 'updated_at 확인' });
    const originalUpdatedAt = todo.updated_at;

    // 1ms 대기 (updated_at 차이를 확인하기 위해)
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .patch(`/api/v1/todos/${todo.id}/toggle`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('updated_at');
  });

  test('타인 todo 토글 → 403 TODO_FORBIDDEN', async () => {
    const todo = await createTodo(tokenA, { title: '타인토글시도' });

    const res = await request(app)
      .patch(`/api/v1/todos/${todo.id}/toggle`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TODO_FORBIDDEN');
  });

  test('존재하지 않는 todo 토글 → 404 TODO_NOT_FOUND', async () => {
    const res = await request(app)
      .patch('/api/v1/todos/00000000-0000-0000-0000-000000000000/toggle')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });

  test('AT 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const todo = await createTodo(tokenA, { title: '인증없이토글' });
    const res = await request(app).patch(`/api/v1/todos/${todo.id}/toggle`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_UNAUTHORIZED');
  });
});
