require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const categoryService = require('../src/services/category.service');
const { AppError } = require('../src/utils/errors');

const TEST_USER_EMAIL = `test-be4-${Date.now()}@example.com`;
let testUserId;
let accessToken;

beforeAll(async () => {
  // 테스트용 유저 생성
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('Password1', 12);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
    [TEST_USER_EMAIL, hash, '카테고리테스터']
  );
  testUserId = rows[0].id;
  accessToken = jwt.sign({ sub: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_USER_EMAIL]);
  await pool.end();
});

describe('GET /api/v1/categories', () => {
  test('AT 포함 → 200, 카테고리 배열 반환', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  test('응답 항목에 id, name, is_default, user_id 필드 포함', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const category = res.body[0];
    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('is_default');
    expect(category).toHaveProperty('user_id');
  });

  test('기본 카테고리 4개(업무, 개인, 건강, 쇼핑) 모두 포함', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    const names = res.body.map((c) => c.name);
    expect(names).toContain('업무');
    expect(names).toContain('개인');
    expect(names).toContain('건강');
    expect(names).toContain('쇼핑');
  });

  test('AT 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_UNAUTHORIZED');
  });

  test('만료된 AT → 401 AUTH_TOKEN_EXPIRED', async () => {
    const expiredToken = jwt.sign({ sub: testUserId }, process.env.JWT_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_TOKEN_EXPIRED');
  });
});

describe('categoryService.validateCategoryAccess', () => {
  test('존재하지 않는 categoryId → CATEGORY_NOT_FOUND', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(
      categoryService.validateCategoryAccess(fakeId, testUserId)
    ).rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND', statusCode: 404 });
  });

  test('is_default=TRUE 카테고리 → 어떤 userId든 접근 허용', async () => {
    const { rows } = await pool.query(
      'SELECT id FROM categories WHERE is_default = TRUE LIMIT 1'
    );
    const defaultCategoryId = rows[0].id;
    await expect(
      categoryService.validateCategoryAccess(defaultCategoryId, testUserId)
    ).resolves.toBeDefined();
  });

  test('다른 사용자 소유 카테고리 → CATEGORY_NOT_FOUND', async () => {
    // 다른 유저 카테고리 직접 삽입
    const { rows } = await pool.query(
      "INSERT INTO categories (name, is_default, user_id) VALUES ('타인카테고리', FALSE, $1) RETURNING id",
      [testUserId]
    );
    const otherCategoryId = rows[0].id;
    const otherUserId = '99999999-9999-9999-9999-999999999999';
    await expect(
      categoryService.validateCategoryAccess(otherCategoryId, otherUserId)
    ).rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND' });
    // 정리
    await pool.query('DELETE FROM categories WHERE id = $1', [otherCategoryId]);
  });

  test('자신 소유 카테고리 → 접근 허용', async () => {
    const { rows } = await pool.query(
      "INSERT INTO categories (name, is_default, user_id) VALUES ('내카테고리', FALSE, $1) RETURNING id",
      [testUserId]
    );
    const myCategoryId = rows[0].id;
    await expect(
      categoryService.validateCategoryAccess(myCategoryId, testUserId)
    ).resolves.toBeDefined();
    await pool.query('DELETE FROM categories WHERE id = $1', [myCategoryId]);
  });
});
