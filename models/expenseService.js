const pool = require('./database');

class ExpenseService {
  /**
   * Get all expenses, optionally filtered by month
   * @param {string} month - Optional month filter (YYYY-MM format)
   * @returns {Promise<Array>} Array of expenses
   */
  async getAll(month = null) {
    try {
      let query = 'SELECT * FROM expense';
      const params = [];
      
      if (month) {
        query += ' WHERE month = ?';
        params.push(month);
      }
      
      query += ' ORDER BY createdAt DESC';
      
      const [expenses] = await pool.query(query, params);
      return expenses;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<Object|null>} Expense object or null
   */
  async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM expense WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data
   * @returns {Promise<Object>} Created expense
   */
  async create(expenseData) {
    const {
      month,
      date,
      category,
      description,
      amount,
      paymentMode,
      paidBy,
      type,
      deductionSource,
      subType
    } = expenseData;

    if (!month || !date || amount == null) {
      throw new Error('month, date and amount are required');
    }

    try {
      // Generate a unique ID (similar to cuid)
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      await pool.query(
        `INSERT INTO expense (id, month, date, category, description, amount, paymentMode, paidBy, type, deductionSource, subType, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          month,
          date,
          category || null,
          description || null,
          parseFloat(amount),
          paymentMode || null,
          paidBy || null,
          type || 'expense',
          deductionSource || null,
          subType || null
        ]
      );
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Delete an expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM expense WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}

module.exports = new ExpenseService();

