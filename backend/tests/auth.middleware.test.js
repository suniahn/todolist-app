const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth.middleware');
const { AppError } = require('../src/utils/errors');

const JWT_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

function mockReq(authHeader) {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function runMiddleware(req) {
  return new Promise((resolve) => {
    authMiddleware(req, {}, (err) => resolve({ req, err }));
  });
}

describe('authMiddleware', () => {
  test('Authorization 헤더 없음 → AUTH_UNAUTHORIZED (401)', async () => {
    const { err } = await runMiddleware(mockReq(null));
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  test('Bearer 형식 아닌 헤더 → AUTH_UNAUTHORIZED (401)', async () => {
    const { err } = await runMiddleware(mockReq('Basic abc123'));
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  test('Bearer 접두사만 있고 토큰 없음 → AUTH_UNAUTHORIZED', async () => {
    const { err } = await runMiddleware(mockReq('Bearer '));
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
  });

  test('서명이 틀린 JWT → AUTH_UNAUTHORIZED (401)', async () => {
    const fakeToken = jwt.sign({ sub: 'user-id' }, 'wrong-secret');
    const { err } = await runMiddleware(mockReq(`Bearer ${fakeToken}`));
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  test('만료된 JWT → AUTH_TOKEN_EXPIRED (401)', async () => {
    const expiredToken = jwt.sign({ sub: 'user-id' }, JWT_SECRET, { expiresIn: -1 });
    const { err } = await runMiddleware(mockReq(`Bearer ${expiredToken}`));
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_TOKEN_EXPIRED');
    expect(err.statusCode).toBe(401);
  });

  test('유효한 JWT → req.userId에 UUID 설정, err 없음', async () => {
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(`Bearer ${token}`);
    const { err } = await runMiddleware(req);
    expect(err).toBeUndefined();
    expect(req.userId).toBe(userId);
  });

  test('유효한 JWT payload.sub이 req.userId에 정확히 반영됨', async () => {
    const userId = 'test-user-uuid-1234';
    const token = jwt.sign({ sub: userId, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(`Bearer ${token}`);
    await runMiddleware(req);
    expect(req.userId).toBe(userId);
  });

  test('next()는 err 없이 호출되어야 함 (유효 토큰)', async () => {
    const token = jwt.sign({ sub: 'some-user' }, JWT_SECRET, { expiresIn: '1h' });
    const next = jest.fn();
    const req = mockReq(`Bearer ${token}`);
    authMiddleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
