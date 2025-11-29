const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');

// Root route - render main app shell (requires view_all permission)
router.get('/', requireAuth, requirePermission('view_all'), indexController.renderIndex);

module.exports = router;

