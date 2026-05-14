const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authMiddleware, categoryController.getAll);

module.exports = router;
