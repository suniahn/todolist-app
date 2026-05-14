const todoRepository = require('../repositories/todo.repository');
const categoryService = require('./category.service');
const { createError } = require('../utils/errors');

async function createTodo(userId, { categoryId, title, description, startDate, dueDate }) {
  await categoryService.validateCategoryAccess(categoryId, userId);
  if (new Date(dueDate) < new Date(startDate)) throw createError('TODO_INVALID_DATE');
  const todo = await todoRepository.create({ userId, categoryId, title, description, startDate, dueDate });
  console.log(`[TODO] created: todoId=${todo.id}, userId=${userId}`);
  return todo;
}

async function getTodos(userId, filters, page = 1, limit = 20) {
  const { categoryId, isCompleted, scheduleStatus } = filters;
  const offset = (page - 1) * limit;
  console.log(`[TODO] list: userId=${userId}, page=${page}, filters=${JSON.stringify(filters)}`);
  const [todos, total] = await Promise.all([
    todoRepository.findAllByUser(userId, { categoryId, isCompleted, scheduleStatus, offset, limit }),
    todoRepository.countByUser(userId, { categoryId, isCompleted, scheduleStatus }),
  ]);
  return { todos, pagination: { page, limit, total } };
}

async function getTodoById(todoId, userId) {
  const todo = await todoRepository.findById(todoId);
  if (!todo) throw createError('TODO_NOT_FOUND');
  if (todo.user_id !== userId) throw createError('TODO_FORBIDDEN');
  return todo;
}

async function updateTodo(todoId, userId, payload) {
  await getTodoById(todoId, userId);
  const { categoryId, startDate, dueDate } = payload;
  if (categoryId) await categoryService.validateCategoryAccess(categoryId, userId);

  const existingTodo = await todoRepository.findById(todoId);
  const finalStartDate = startDate || existingTodo.start_date;
  const finalDueDate = dueDate || existingTodo.due_date;
  if (new Date(finalDueDate) < new Date(finalStartDate)) throw createError('TODO_INVALID_DATE');

  const fields = {};
  if (payload.title !== undefined) fields.title = payload.title;
  if (payload.description !== undefined) fields.description = payload.description;
  if (startDate !== undefined) fields.start_date = startDate;
  if (dueDate !== undefined) fields.due_date = dueDate;
  if (categoryId !== undefined) fields.category_id = categoryId;

  const updated = await todoRepository.update(todoId, fields);
  console.log(`[TODO] updated: todoId=${todoId}, userId=${userId}`);
  return updated;
}

async function deleteTodo(todoId, userId) {
  await getTodoById(todoId, userId);
  await todoRepository.deleteTodo(todoId);
  console.log(`[TODO] deleted: todoId=${todoId}, userId=${userId}`);
}

async function toggleTodo(todoId, userId) {
  const todo = await getTodoById(todoId, userId);
  const result = await todoRepository.toggleCompletion(todoId, !todo.is_completed);
  console.log(`[TODO] toggled: todoId=${todoId}, is_completed=${result.is_completed}`);
  return result;
}

module.exports = { createTodo, getTodos, getTodoById, updateTodo, deleteTodo, toggleTodo };
