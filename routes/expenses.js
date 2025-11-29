const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');

// Get all expenses (requires view_all permission)
router.get('/', requireAuth, requirePermission('view_all'), expenseController.getExpenses);

// Create a new expense (requires add_expense permission)
router.post('/', requireAuth, requirePermission('add_expense'), expenseController.createExpense);

// Delete an expense (requires delete_expense permission)
router.delete('/:id', requireAuth, requirePermission('delete_expense'), expenseController.deleteExpense);

module.exports = router;

