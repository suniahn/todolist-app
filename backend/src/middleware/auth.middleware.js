const jwt = require('jsonwebtoken');
const { createError } = require('../utils/errors');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('AUTH_UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    console.log(`[AUTH] token verified: userId=${payload.sub}`);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.warn('[AUTH] token expired');
      return next(createError('AUTH_TOKEN_EXPIRED'));
    }
    console.warn('[AUTH] invalid token');
    return next(createError('AUTH_UNAUTHORIZED'));
  }
}

module.exports = authMiddleware;
