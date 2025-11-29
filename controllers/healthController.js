const pool = require('../models/database');

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function healthCheck(req, res) {
  try {
    await pool.query('SELECT 1 as test');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error', error: 'Database not reachable' });
  }
}

module.exports = {
  healthCheck
};

