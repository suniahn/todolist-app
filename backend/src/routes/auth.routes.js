const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

const isTest = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', loginLimiter, authController.refresh);

module.exports = router;
