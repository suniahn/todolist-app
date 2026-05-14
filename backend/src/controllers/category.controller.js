const categoryService = require('../services/category.service');
const { createError } = require('../utils/errors');

async function getAll(req, res, next) {
  try {
    const categories = await categoryService.getCategories(req.userId);
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || String(name).trim().length === 0) {
      return next(createError('VALIDATION_ERROR', '카테고리 이름은 필수입니다'));
    }
    if (String(name).trim().length > 50) {
      return next(createError('VALIDATION_ERROR', '카테고리 이름은 50자 이하여야 합니다'));
    }
    const category = await categoryService.createCategory(req.userId, name);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return next(createError('VALIDATION_ERROR', '유효하지 않은 카테고리 ID입니다'));
    }
    const { name } = req.body;
    if (!name || String(name).trim().length === 0) {
      return next(createError('VALIDATION_ERROR', '카테고리 이름은 필수입니다'));
    }
    if (String(name).trim().length > 50) {
      return next(createError('VALIDATION_ERROR', '카테고리 이름은 50자 이하여야 합니다'));
    }
    const category = await categoryService.updateCategory(categoryId, req.userId, name);
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return next(createError('VALIDATION_ERROR', '유효하지 않은 카테고리 ID입니다'));
    }
    await categoryService.deleteCategory(categoryId, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
