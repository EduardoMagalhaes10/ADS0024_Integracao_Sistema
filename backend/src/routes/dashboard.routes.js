const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ctrl.overview);

module.exports = router;
