const expenseService = require('../models/expenseService');
const collectionService = require('../models/collectionService');

/**
 * Helper function to parse amount values
 * @param {any} val - Value to parse
 * @returns {number} Parsed number
 */
function parseAmount(val) {
  const num = typeof val === 'number' ? val : parseFloat(val || 0);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Get summary data for a specific month
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSummary(req, res) {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'month query parameter is required (e.g. 2025-06)' });
  }

  try {
    // Get monthly data
    const expenses = await expenseService.getAll(month);
    const collections = await collectionService.getAll(month);

    // Get all-time data
    const allExpenses = await expenseService.getAll();
    const allCollections = await collectionService.getAll();

    // Calculate monthly maintenance income
    const maintenanceIncome = collections
      .filter(
        (c) =>
          c.type === 'Maintenance' ||
          c.subType === 'maintenance'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    // Calculate monthly corpus income
    const corpusIncome = collections
      .filter(
        (c) =>
          c.type === 'Corpus' ||
          c.subType === 'corpus'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    // Separate expenses by deduction source
    const maintenanceExpenses = expenses.filter(
      (e) => e.deductionSource !== 'corpus' && e.subType !== 'corpus' && e.type !== 'Corpus'
    );
    const corpusExpenses = expenses.filter(
      (e) => e.deductionSource === 'corpus' || e.subType === 'corpus' || e.type === 'Corpus'
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);

    // Calculate all-time maintenance income
    const allTimeMaintenanceIncome = allCollections
      .filter(
        (c) =>
          c.type === 'Maintenance' ||
          c.subType === 'maintenance'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    // Calculate all-time maintenance expenses
    const allTimeMaintenanceExpenses = allExpenses
      .filter(
        (e) => e.deductionSource !== 'corpus' && e.subType !== 'corpus' && e.type !== 'Corpus'
      )
      .reduce((sum, e) => sum + parseAmount(e.amount), 0);

    const balance = allTimeMaintenanceIncome - allTimeMaintenanceExpenses;

    // Calculate all-time corpus income
    const allTimeCorpusIncome = allCollections
      .filter(
        (c) =>
          c.type === 'Corpus' ||
          c.subType === 'corpus'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    // Calculate all-time corpus expenses
    const allTimeCorpusExpenses = allExpenses
      .filter(
        (e) => e.deductionSource === 'corpus' || e.subType === 'corpus' || e.type === 'Corpus'
      )
      .reduce((sum, e) => sum + parseAmount(e.amount), 0);

    const corpusFundBalance = allTimeCorpusIncome - allTimeCorpusExpenses;

    res.json({
      month,
      monthly: {
        maintenanceIncome,
        corpusIncome,
        totalExpenses,
        maintenanceExpenses: maintenanceExpenses.length,
        corpusExpenses: corpusExpenses.length
      },
      allTime: {
        maintenanceIncome: allTimeMaintenanceIncome,
        maintenanceExpenses: allTimeMaintenanceExpenses,
        corpusIncome: allTimeCorpusIncome,
        corpusExpenses: allTimeCorpusExpenses,
        balance,
        corpusFundBalance
      }
    });
  } catch (err) {
    console.error('Error computing summary:', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
}

module.exports = {
  getSummary
};

