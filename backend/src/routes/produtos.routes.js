const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/produtos.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/options', ctrl.options);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.toggleStatus);

module.exports = router;
