const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Get all expenses
router.get('/', expenseController.getExpenses);

// Create a new expense
router.post('/', expenseController.createExpense);

// Delete an expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

