const pool = require('./database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findByUsername(username) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.password_hash, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
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
 * Find user by ID
 * @param {string} userId - User ID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findById(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = TRUE`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

/**
 * Verify password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
}

/**
 * Hash password
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(plainPassword) {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data (username, password, role_id)
 * @returns {Promise<Object>} Created user object (without password)
 */
async function createUser(userData) {
  try {
    const { username, password, role_id } = userData;
    const id = uuidv4();
    const password_hash = await hashPassword(password);
    
    await pool.execute(
      `INSERT INTO users (id, username, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [id, username, password_hash, role_id]
    );
    
    return findById(id);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = {
  findByUsername,
  findById,
  verifyPassword,
  hashPassword,
  createUser
};

