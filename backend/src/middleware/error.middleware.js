const { AppError, ERROR_CODES } = require('../utils/errors');

function errorMiddleware(err, req, res, next) {
  if (err instanceof AppError) {
    console.warn(`[ERROR] ${err.code} (${err.statusCode}): ${err.message}`);
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  console.error('[ERROR] unhandled exception:', err);
  const { statusCode, message } = ERROR_CODES.INTERNAL_SERVER_ERROR;
  return res.status(statusCode).json({
    code: 'INTERNAL_SERVER_ERROR',
    message,
  });
}

module.exports = errorMiddleware;
