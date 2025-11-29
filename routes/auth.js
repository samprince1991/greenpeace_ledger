const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Render login page
router.get('/login', authController.renderLogin);

// Handle login POST
router.post('/login', authController.login);

// Handle logout
router.get('/logout', authController.logout);

module.exports = router;

