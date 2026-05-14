const categoryRepository = require('../repositories/category.repository');
const { createError } = require('../utils/errors');

async function getCategories(userId) {
  return categoryRepository.findAllByUser(userId);
}

async function validateCategoryAccess(categoryId, userId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw createError('CATEGORY_NOT_FOUND');
  if (category.is_default || category.user_id === userId) return category;
  throw createError('CATEGORY_NOT_FOUND');
}

module.exports = { getCategories, validateCategoryAccess };
