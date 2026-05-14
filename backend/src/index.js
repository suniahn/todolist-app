require('dotenv').config();

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key] || process.env[key].length < 32) {
    throw new Error(`Environment variable ${key} is missing or too short (minimum 32 characters)`);
  }
}

const app = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 3000;

async function start() {
  await pool.query('SELECT 1');
  console.log('Database connection established');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
