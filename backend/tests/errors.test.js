const { AppError, ERROR_CODES, createError } = require('../src/utils/errors');

describe('AppError', () => {
  test('should create AppError with correct fields', () => {
    const err = new AppError('AUTH_UNAUTHORIZED', '로그인이 필요합니다', 401);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.message).toBe('로그인이 필요합니다');
    expect(err.statusCode).toBe(401);
  });

  test('should have all 11 error codes defined', () => {
    const expectedCodes = [
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_EMAIL_DUPLICATE',
      'AUTH_TOKEN_EXPIRED',
      'AUTH_UNAUTHORIZED',
      'TODO_NOT_FOUND',
      'TODO_FORBIDDEN',
      'TODO_INVALID_DATE',
      'CATEGORY_NOT_FOUND',
      'CATEGORY_IN_USE',
      'VALIDATION_ERROR',
      'INTERNAL_SERVER_ERROR',
    ];
    expectedCodes.forEach((code) => {
      expect(ERROR_CODES[code]).toBeDefined();
      expect(ERROR_CODES[code].statusCode).toBeDefined();
      expect(ERROR_CODES[code].message).toBeDefined();
    });
  });

  test('AUTH_INVALID_CREDENTIALS should have statusCode 401', () => {
    expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS.statusCode).toBe(401);
  });

  test('AUTH_EMAIL_DUPLICATE should have statusCode 409', () => {
    expect(ERROR_CODES.AUTH_EMAIL_DUPLICATE.statusCode).toBe(409);
  });

  test('TODO_NOT_FOUND should have statusCode 404', () => {
    expect(ERROR_CODES.TODO_NOT_FOUND.statusCode).toBe(404);
  });

  test('TODO_FORBIDDEN should have statusCode 403', () => {
    expect(ERROR_CODES.TODO_FORBIDDEN.statusCode).toBe(403);
  });

  test('INTERNAL_SERVER_ERROR should have statusCode 500', () => {
    expect(ERROR_CODES.INTERNAL_SERVER_ERROR.statusCode).toBe(500);
  });
});

describe('createError', () => {
  test('should create AppError with default message', () => {
    const err = createError('AUTH_UNAUTHORIZED');
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBeTruthy();
  });

  test('should create AppError with custom message', () => {
    const err = createError('VALIDATION_ERROR', '이메일 형식이 잘못되었습니다');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('이메일 형식이 잘못되었습니다');
    expect(err.statusCode).toBe(400);
  });

  test('should create error for each of 11 codes without throwing', () => {
    const codes = Object.keys(ERROR_CODES);
    codes.forEach((code) => {
      expect(() => createError(code)).not.toThrow();
    });
  });
});
