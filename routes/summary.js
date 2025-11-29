const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');

// Get summary data (requires view_all permission)
router.get('/', requireAuth, requirePermission('view_all'), summaryController.getSummary);

module.exports = router;

