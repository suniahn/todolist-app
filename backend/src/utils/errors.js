class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
  }
}

const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: { statusCode: 401, message: '이메일 또는 비밀번호가 올바르지 않습니다' },
  AUTH_EMAIL_DUPLICATE: { statusCode: 409, message: '이미 사용 중인 이메일입니다' },
  AUTH_TOKEN_EXPIRED: { statusCode: 401, message: '인증이 만료되었습니다. 다시 로그인해주세요' },
  AUTH_UNAUTHORIZED: { statusCode: 401, message: '로그인이 필요합니다' },
  TODO_NOT_FOUND: { statusCode: 404, message: '할일을 찾을 수 없습니다' },
  TODO_FORBIDDEN: { statusCode: 403, message: '접근 권한이 없습니다' },
  TODO_INVALID_DATE: { statusCode: 400, message: '종료예정일은 시작일보다 이전일 수 없습니다' },
  CATEGORY_NOT_FOUND: { statusCode: 404, message: '카테고리를 찾을 수 없습니다' },
  CATEGORY_IN_USE: { statusCode: 409, message: '해당 카테고리에 할일이 존재하여 삭제할 수 없습니다' },
  VALIDATION_ERROR: { statusCode: 400, message: '입력값을 확인해주세요' },
  INTERNAL_SERVER_ERROR: { statusCode: 500, message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요' },
};

function createError(code, customMessage) {
  const { statusCode, message } = ERROR_CODES[code];
  return new AppError(code, customMessage || message, statusCode);
}

module.exports = { AppError, ERROR_CODES, createError };
