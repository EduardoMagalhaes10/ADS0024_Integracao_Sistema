const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vendas.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
