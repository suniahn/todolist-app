const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { createError } = require('../utils/errors');

// 로그용 이메일 마스킹: abc@example.com → a**@example.com
function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}

// 사용자 미존재 시에도 동일한 bcrypt 비용을 소모해 타이밍 사이드채널 차단
const DUMMY_HASH = '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

async function register(email, password, name) {
  console.log(`[AUTH] register attempt: ${maskEmail(email)}`);
  const existing = await userRepository.findByEmail(email);
  if (existing) throw createError('AUTH_EMAIL_DUPLICATE');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ email, hashedPassword, name });
  console.log(`[AUTH] register success: userId=${user.id}`);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function login(email, password) {
  console.log(`[AUTH] login attempt: ${maskEmail(email)}`);
  const user = await userRepository.findByEmail(email);

  const hash = user ? user.password : DUMMY_HASH;
  const match = await bcrypt.compare(password, hash);
  if (!user || !match) throw createError('AUTH_INVALID_CREDENTIALS');

  const accessToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  console.log(`[AUTH] login success: userId=${user.id}`);

  const { password: _, ...userWithoutPassword } = user;
  return { accessToken, refreshToken, user: userWithoutPassword };
}

async function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    const accessToken = jwt.sign(
      { sub: payload.sub },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    console.log(`[AUTH] token refreshed: userId=${payload.sub}`);
    return { accessToken };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw createError('AUTH_TOKEN_EXPIRED');
    }
    throw createError('AUTH_UNAUTHORIZED');
  }
}

function logout() {
  console.log('[AUTH] logout');
  return { message: 'ok' };
}

module.exports = { register, login, refreshAccessToken, logout };
