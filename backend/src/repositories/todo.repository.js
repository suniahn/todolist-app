const pool = require('../db/pool');

async function findById(todoId) {
  const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [todoId]);
  return rows[0] || null;
}

async function findAllByUser(userId, { categoryId, isCompleted, scheduleStatus, offset = 0, limit = 20 }) {
  const conditions = ['user_id = $1'];
  const params = [userId];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`category_id = $${params.length}`);
  }
  if (isCompleted !== undefined && isCompleted !== null) {
    params.push(isCompleted);
    conditions.push(`is_completed = $${params.length}`);
  }
  if (scheduleStatus === 'overdue') {
    conditions.push(`due_date < CURRENT_DATE AND is_completed = FALSE`);
  } else if (scheduleStatus === 'ongoing') {
    conditions.push(`(due_date >= CURRENT_DATE OR is_completed = TRUE)`);
  }

  params.push(offset);
  const offsetParam = params.length;
  params.push(limit);
  const limitParam = params.length;

  const query = `SELECT * FROM todos WHERE ${conditions.join(' AND ')} ORDER BY due_date ASC OFFSET $${offsetParam} LIMIT $${limitParam}`;
  const { rows } = await pool.query(query, params);
  return rows;
}

async function countByUser(userId, { categoryId, isCompleted, scheduleStatus }) {
  const conditions = ['user_id = $1'];
  const params = [userId];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`category_id = $${params.length}`);
  }
  if (isCompleted !== undefined && isCompleted !== null) {
    params.push(isCompleted);
    conditions.push(`is_completed = $${params.length}`);
  }
  if (scheduleStatus === 'overdue') {
    conditions.push(`due_date < CURRENT_DATE AND is_completed = FALSE`);
  } else if (scheduleStatus === 'ongoing') {
    conditions.push(`(due_date >= CURRENT_DATE OR is_completed = TRUE)`);
  }

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM todos WHERE ${conditions.join(' AND ')}`,
    params
  );
  return rows[0].total;
}

async function create({ userId, categoryId, title, description, startDate, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, start_date, due_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, categoryId, title, description || null, startDate, dueDate]
  );
  return rows[0];
}

async function update(todoId, fields) {
  const setClauses = [];
  const params = [todoId];

  const allowed = ['title', 'description', 'start_date', 'due_date', 'category_id', 'is_completed'];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      setClauses.push(`${key} = $${params.length}`);
    }
  }
  if (setClauses.length === 0) return findById(todoId);

  setClauses.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] || null;
}

async function deleteTodo(todoId) {
  await pool.query('DELETE FROM todos WHERE id = $1', [todoId]);
}

async function toggleCompletion(todoId, newCompleted) {
  const { rows } = await pool.query(
    `UPDATE todos
     SET is_completed = $2,
         completed_at = CASE WHEN $2 = TRUE THEN NOW() ELSE NULL END,
         updated_at   = NOW()
     WHERE id = $1
     RETURNING *`,
    [todoId, newCompleted]
  );
  return rows[0] || null;
}

module.exports = { findById, findAllByUser, countByUser, create, update, deleteTodo, toggleCompletion };
