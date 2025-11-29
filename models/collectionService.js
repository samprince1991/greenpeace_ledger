const pool = require('./database');

class CollectionService {
  /**
   * Get all collections, optionally filtered by month
   * @param {string} month - Optional month filter (YYYY-MM format)
   * @returns {Promise<Array>} Array of collections
   */
  async getAll(month = null) {
    try {
      let query = 'SELECT * FROM collection';
      const params = [];
      
      if (month) {
        query += ' WHERE month = ?';
        params.push(month);
      }
      
      query += ' ORDER BY createdAt DESC';
      
      const [collections] = await pool.query(query, params);
      return collections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  /**
   * Get collection by ID
   * @param {string} id - Collection ID
   * @returns {Promise<Object|null>} Collection object or null
   */
  async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM collection WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching collection by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new collection
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} Created collection
   */
  async create(collectionData) {
    const {
      month,
      date,
      type,
      subType,
      flatNumber,
      category,
      amount,
      paymentMode,
      collectedBy
    } = collectionData;

    if (!month || !date || amount == null) {
      throw new Error('month, date and amount are required');
    }

    try {
      // Generate a unique ID (similar to cuid)
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      await pool.query(
        `INSERT INTO collection (id, month, date, type, subType, flatNumber, category, amount, paymentMode, collectedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          month,
          date,
          type || null,
          subType || null,
          flatNumber || null,
          category || flatNumber || null,
          parseFloat(amount),
          paymentMode || null,
          collectedBy || null
        ]
      );
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection by ID
   * @param {string} id - Collection ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM collection WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }
}

module.exports = new CollectionService();

