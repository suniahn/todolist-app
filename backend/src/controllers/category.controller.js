const categoryService = require('../services/category.service');

async function getAll(req, res, next) {
  try {
    const categories = await categoryService.getCategories(req.userId);
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll };
