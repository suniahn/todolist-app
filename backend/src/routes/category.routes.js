const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.get('/',      authMiddleware, categoryController.getAll);
router.post('/',     authMiddleware, categoryController.create);
router.put('/:id',   authMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, categoryController.remove);

module.exports = router;
