const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Root route - render main app shell
router.get('/', indexController.renderIndex);

module.exports = router;

