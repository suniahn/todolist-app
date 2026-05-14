const { Router } = require('express');
const todoController = require('../controllers/todo.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/', todoController.getAll);
router.post('/', todoController.create);
router.get('/:id', todoController.getOne);
router.put('/:id', todoController.update);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/toggle', todoController.toggle);

module.exports = router;
