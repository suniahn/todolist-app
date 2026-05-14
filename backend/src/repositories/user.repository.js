const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function create({ email, hashedPassword, name }) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at, updated_at',
    [email, hashedPassword, name]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
