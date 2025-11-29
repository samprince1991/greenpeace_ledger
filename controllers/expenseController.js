const expenseService = require('../models/expenseService');

/**
 * Get all expenses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getExpenses(req, res) {
  try {
    const { month } = req.query;
    const expenses = await expenseService.getAll(month);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
}

/**
 * Create a new expense
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createExpense(req, res) {
  try {
    const expense = await expenseService.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create expense' });
  }
}

/**
 * Delete an expense
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const deleted = await expenseService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
}

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense
};

