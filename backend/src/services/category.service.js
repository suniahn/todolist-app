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

async function createCategory(userId, name) {
  if (!name || name.trim().length === 0) {
    throw createError('VALIDATION_ERROR', '카테고리 이름은 필수입니다');
  }
  const trimmedName = name.trim();
  if (trimmedName.length > 50) {
    throw createError('VALIDATION_ERROR', '카테고리 이름은 50자 이하여야 합니다');
  }

  const existing = await categoryRepository.findByNameAndUser(trimmedName, userId);
  if (existing) {
    throw createError('VALIDATION_ERROR', '이미 사용 중인 카테고리 이름입니다');
  }

  return categoryRepository.create(userId, trimmedName);
}

async function updateCategory(categoryId, userId, name) {
  if (!name || name.trim().length === 0) {
    throw createError('VALIDATION_ERROR', '카테고리 이름은 필수입니다');
  }
  const trimmedName = name.trim();
  if (trimmedName.length > 50) {
    throw createError('VALIDATION_ERROR', '카테고리 이름은 50자 이하여야 합니다');
  }

  const category = await categoryRepository.findById(categoryId);
  if (!category) throw createError('CATEGORY_NOT_FOUND');

  if (category.is_default) {
    throw createError('VALIDATION_ERROR', '기본 카테고리는 수정할 수 없습니다');
  }
  if (category.user_id !== userId) {
    throw createError('CATEGORY_NOT_FOUND');
  }

  const existing = await categoryRepository.findByNameAndUser(trimmedName, userId);
  if (existing && existing.id !== categoryId) {
    throw createError('VALIDATION_ERROR', '이미 사용 중인 카테고리 이름입니다');
  }

  return categoryRepository.update(categoryId, trimmedName);
}

async function deleteCategory(categoryId, userId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw createError('CATEGORY_NOT_FOUND');

  if (category.is_default) {
    throw createError('VALIDATION_ERROR', '기본 카테고리는 삭제할 수 없습니다');
  }
  if (category.user_id !== userId) {
    throw createError('CATEGORY_NOT_FOUND');
  }

  const inUse = await categoryRepository.hasRelatedTodos(categoryId);
  if (inUse) throw createError('CATEGORY_IN_USE');

  await categoryRepository.deleteById(categoryId);
}

module.exports = {
  getCategories,
  validateCategoryAccess,
  createCategory,
  updateCategory,
  deleteCategory,
};
