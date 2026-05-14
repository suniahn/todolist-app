const authService = require('../services/auth.service');
const { createError } = require('../utils/errors');

// RFC 5322 간략화 이메일 검증
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 최소 8자, 영문 + 숫자 포함
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return next(createError('VALIDATION_ERROR', '올바른 이메일 형식을 입력해주세요'));
    }
    if (!password || !PASSWORD_REGEX.test(password)) {
      return next(createError('VALIDATION_ERROR', '비밀번호는 8자 이상 영문과 숫자를 포함해야 합니다'));
    }
    if (!name || name.trim().length < 1 || name.trim().length > 50) {
      return next(createError('VALIDATION_ERROR', '이름은 1자 이상 50자 이하여야 합니다'));
    }

    const user = await authService.register(email, password, name.trim());
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('VALIDATION_ERROR', '이메일과 비밀번호를 입력해주세요'));
    }

    const tokens = await authService.login(email, password);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError('VALIDATION_ERROR', 'refreshToken이 필요합니다'));
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = authService.logout();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
