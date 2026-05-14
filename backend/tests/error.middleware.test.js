const errorMiddleware = require('../src/middleware/error.middleware');
const { AppError } = require('../src/utils/errors');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorMiddleware', () => {
  const req = {};
  const next = jest.fn();

  test('should handle AppError with correct statusCode and body', () => {
    const err = new AppError('AUTH_UNAUTHORIZED', '로그인이 필요합니다', 401);
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: 'AUTH_UNAUTHORIZED',
      message: '로그인이 필요합니다',
    });
  });

  test('should handle AppError with 404', () => {
    const err = new AppError('TODO_NOT_FOUND', '할일을 찾을 수 없습니다', 404);
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: 'TODO_NOT_FOUND',
      message: '할일을 찾을 수 없습니다',
    });
  });

  test('should handle AppError with 409', () => {
    const err = new AppError('AUTH_EMAIL_DUPLICATE', '이미 사용 중인 이메일입니다', 409);
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('should handle unknown error as INTERNAL_SERVER_ERROR (500)', () => {
    const err = new Error('Unexpected database failure');
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
      })
    );
  });

  test('should return { code, message } format for AppError', () => {
    const err = new AppError('TODO_FORBIDDEN', '접근 권한이 없습니다', 403);
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('message');
    expect(Object.keys(body)).toHaveLength(2);
  });

  test('should return { code, message } format for unknown error', () => {
    const err = new Error('random error');
    const res = mockRes();
    errorMiddleware(err, req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('message');
  });
});
