const pool = require('./database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class UserService {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @param {boolean} includeInactive - Whether to include inactive users
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id, includeInactive = false) {
    try {
      let query = `
        SELECT u.id, u.username, u.password_hash, u.role_id, u.is_active, 
               u.created_at, u.updated_at, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `;
      
      if (!includeInactive) {
        query += ' AND u.is_active = TRUE';
      }
      
      const [rows] = await pool.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, u.password_hash, u.role_id, u.is_active, 
                u.created_at, u.updated_at, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.username = ? AND u.is_active = TRUE`,
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Get all users
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers() {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, u.role_id, u.is_active, 
                u.created_at, u.updated_at, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         ORDER BY u.created_at DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data { username, password, role_id }
   * @returns {Promise<Object>} Created user object
   */
  async createUser({ username, password, role_id }) {
    try {
      const id = uuidv4();
      const password_hash = await bcrypt.hash(password, 10);
      
      await pool.execute(
        `INSERT INTO users (id, username, password_hash, role_id, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [id, username, password_hash, role_id]
      );
      
      return await this.findById(id, true);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update { username?, role_id?, is_active?, password? }
   * @returns {Promise<Object|null>} Updated user object or null
   */
  async updateUser(id, updateData) {
    try {
      const updates = [];
      const values = [];
      
      if (updateData.username !== undefined) {
        updates.push('username = ?');
        values.push(updateData.username);
      }
      
      if (updateData.role_id !== undefined) {
        updates.push('role_id = ?');
        values.push(updateData.role_id);
      }
      
      if (updateData.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(updateData.is_active);
      }
      
      if (updateData.password) {
        const password_hash = await bcrypt.hash(updateData.password, 10);
        updates.push('password_hash = ?');
        values.push(password_hash);
      }
      
      if (updates.length === 0) {
        return await this.findById(id, true);
      }
      
      values.push(id);
      
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.findById(id, true);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if user was deleted
   */
  async deleteUser(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
}

module.exports = new UserService();

