const todoService = require('../services/todo.service');
const { createError } = require('../utils/errors');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const filters = {
      categoryId: req.query.category_id || null,
      isCompleted: req.query.is_completed !== undefined
        ? req.query.is_completed === 'true'
        : undefined,
      scheduleStatus: req.query.schedule_status || null,
    };
    const result = await todoService.getTodos(req.userId, filters, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, start_date, due_date, category_id } = req.body;

    if (!title || title.length > 200)
      return next(createError('VALIDATION_ERROR', '제목은 1자 이상 200자 이하여야 합니다'));
    if (description && description.length > 1000)
      return next(createError('VALIDATION_ERROR', '설명은 1000자 이하여야 합니다'));
    if (!start_date || !DATE_REGEX.test(start_date))
      return next(createError('VALIDATION_ERROR', '시작일은 YYYY-MM-DD 형식이어야 합니다'));
    if (!due_date || !DATE_REGEX.test(due_date))
      return next(createError('VALIDATION_ERROR', '종료예정일은 YYYY-MM-DD 형식이어야 합니다'));
    if (!category_id || !UUID_REGEX.test(category_id))
      return next(createError('VALIDATION_ERROR', '유효한 category_id가 필요합니다'));

    const todo = await todoService.createTodo(req.userId, {
      categoryId: category_id,
      title,
      description,
      startDate: start_date,
      dueDate: due_date,
    });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    if (!UUID_REGEX.test(req.params.id))
      return next(createError('VALIDATION_ERROR', '유효한 todo id가 필요합니다'));
    const todo = await todoService.getTodoById(req.params.id, req.userId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!UUID_REGEX.test(req.params.id))
      return next(createError('VALIDATION_ERROR', '유효한 todo id가 필요합니다'));
    const { title, description, start_date, due_date, category_id } = req.body;

    if (title !== undefined && (title.length === 0 || title.length > 200))
      return next(createError('VALIDATION_ERROR', '제목은 1자 이상 200자 이하여야 합니다'));
    if (description !== undefined && description.length > 1000)
      return next(createError('VALIDATION_ERROR', '설명은 1000자 이하여야 합니다'));
    if (start_date !== undefined && !DATE_REGEX.test(start_date))
      return next(createError('VALIDATION_ERROR', '시작일은 YYYY-MM-DD 형식이어야 합니다'));
    if (due_date !== undefined && !DATE_REGEX.test(due_date))
      return next(createError('VALIDATION_ERROR', '종료예정일은 YYYY-MM-DD 형식이어야 합니다'));
    if (category_id !== undefined && !UUID_REGEX.test(category_id))
      return next(createError('VALIDATION_ERROR', '유효한 category_id가 필요합니다'));

    const todo = await todoService.updateTodo(req.params.id, req.userId, {
      title,
      description,
      startDate: start_date,
      dueDate: due_date,
      categoryId: category_id,
    });
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    if (!UUID_REGEX.test(req.params.id))
      return next(createError('VALIDATION_ERROR', '유효한 todo id가 필요합니다'));
    await todoService.deleteTodo(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function toggle(req, res, next) {
  try {
    if (!UUID_REGEX.test(req.params.id))
      return next(createError('VALIDATION_ERROR', '유효한 todo id가 필요합니다'));
    const todo = await todoService.toggleTodo(req.params.id, req.userId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, getOne, update, deleteTodo, toggle };
