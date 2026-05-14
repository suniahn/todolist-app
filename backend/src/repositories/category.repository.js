const pool = require('../db/pool');

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories
     WHERE is_default = TRUE OR user_id = $1
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return rows;
}

async function findById(categoryId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [categoryId]
  );
  return rows[0] || null;
}

module.exports = { findAllByUser, findById };
