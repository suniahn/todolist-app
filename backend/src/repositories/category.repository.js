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

async function findByNameAndUser(name, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories
     WHERE name = $1 AND (is_default = TRUE OR user_id = $2)`,
    [name, userId]
  );
  return rows[0] || null;
}

async function create(userId, name) {
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, name]
  );
  return rows[0];
}

async function update(id, name) {
  const { rows } = await pool.query(
    `UPDATE categories
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );
  return rows[0] || null;
}

async function deleteById(id) {
  await pool.query(
    'DELETE FROM categories WHERE id = $1',
    [id]
  );
}

async function hasRelatedTodos(id) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS cnt FROM todos WHERE category_id = $1',
    [id]
  );
  return parseInt(rows[0].cnt, 10) > 0;
}

module.exports = {
  findAllByUser,
  findById,
  findByNameAndUser,
  create,
  update,
  deleteById,
  hasRelatedTodos,
};
