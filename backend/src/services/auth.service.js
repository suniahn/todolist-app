const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { createError } = require('../utils/errors');

async function register(email, password, name) {
  console.log(`[AUTH] register attempt: ${email}`);
  const existing = await userRepository.findByEmail(email);
  if (existing) throw createError('AUTH_EMAIL_DUPLICATE');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ email, hashedPassword, name });
  console.log(`[AUTH] register success: userId=${user.id}, email=${email}`);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function login(email, password) {
  console.log(`[AUTH] login attempt: ${email}`);
  const user = await userRepository.findByEmail(email);
  if (!user) throw createError('AUTH_INVALID_CREDENTIALS');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw createError('AUTH_INVALID_CREDENTIALS');

  const accessToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  console.log(`[AUTH] login success: userId=${user.id}, email=${email}`);

  return { accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { sub: payload.sub },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
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
