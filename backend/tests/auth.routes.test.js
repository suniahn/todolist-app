require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');

const TEST_EMAIL = `test-be3-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password1';
const TEST_NAME = '테스트유저';

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'test-be3-%'");
  await pool.end();
});

describe('POST /api/v1/auth/register', () => {
  test('성공 → 201, 유저 정보 반환 (password 제외)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', TEST_EMAIL);
    expect(res.body).toHaveProperty('name', TEST_NAME);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).toHaveProperty('updated_at');
  });

  test('중복 이메일 → 409 AUTH_EMAIL_DUPLICATE', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('AUTH_EMAIL_DUPLICATE');
  });

  test('잘못된 이메일 형식 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: TEST_PASSWORD, name: TEST_NAME });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('비밀번호 7자 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `short-pw-${Date.now()}@example.com`, password: 'Pass1', name: TEST_NAME });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('비밀번호 영문 없음 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `num-pw-${Date.now()}@example.com`, password: '12345678', name: TEST_NAME });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('name 없음 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `no-name-${Date.now()}@example.com`, password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  test('성공 → 200, { accessToken, refreshToken }', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('존재하지 않는 이메일 → 401 AUTH_INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  test('잘못된 비밀번호 → 401 AUTH_INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass9' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  test('email 누락 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('password 누락 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  let validRefreshToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    validRefreshToken = res.body.refreshToken;
  });

  test('유효한 refreshToken → 200, { accessToken }', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: validRefreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('refreshToken');
  });

  test('만료된 refreshToken → 401 AUTH_TOKEN_EXPIRED', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user-id' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: -1 }
    );
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: expiredToken });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_TOKEN_EXPIRED');
  });

  test('refreshToken 없음 → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/logout', () => {
  let validAccessToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    validAccessToken = res.body.accessToken;
  });

  test('Authorization 헤더 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_UNAUTHORIZED');
  });

  test('유효한 AT → 200, { message: "ok" }', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .send({ refreshToken: 'some-token' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'ok');
  });
});

describe('bcrypt 해시 검증', () => {
  test('DB에 저장된 비밀번호가 bcrypt 해시 형식($2b$12$)', async () => {
    const { rows } = await pool.query(
      'SELECT password FROM users WHERE email = $1',
      [TEST_EMAIL]
    );
    expect(rows[0]).toBeDefined();
    expect(rows[0].password).toMatch(/^\$2b\$12\$/);
  });
});
