const pool = require('./database');

/**
 * Get all permissions for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Array>} Array of permission objects
 */
async function getRolePermissions(roleId) {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.resource, p.action, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting role permissions:', error);
    throw error;
  }
}

/**
 * Get all permissions for a user (via their role)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of permission objects
 */
async function getUserPermissions(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.resource, p.action, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON rp.role_id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    throw error;
  }
}

/**
 * Check if user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name (e.g., 'view_all', 'add_collection')
 * @returns {Promise<boolean>} True if user has the permission
 */
async function hasPermission(userId, permissionName) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON rp.role_id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE AND p.name = ?`,
      [userId, permissionName]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    throw error;
  }
}

/**
 * Get all roles
 * @returns {Promise<Array>} Array of role objects
 */
async function getAllRoles() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, created_at, updated_at
       FROM roles
       ORDER BY name`
    );
    return rows;
  } catch (error) {
    console.error('Error getting all roles:', error);
    throw error;
  }
}

/**
 * Get role by name
 * @param {string} roleName - Role name
 * @returns {Promise<Object|null>} Role object or null
 */
async function getRoleByName(roleName) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description
       FROM roles
       WHERE name = ?`,
      [roleName]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting role by name:', error);
    throw error;
  }
}

/**
 * Get all permissions
 * @returns {Promise<Array>} Array of all permission objects
 */
async function getAllPermissions() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, resource, action, description
       FROM permissions
       ORDER BY resource, action`
    );
    return rows;
  } catch (error) {
    console.error('Error getting all permissions:', error);
    throw error;
  }
}

/**
 * Get role by ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object|null>} Role object or null
 */
async function getRoleById(roleId) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, created_at, updated_at
       FROM roles
       WHERE id = ?`,
      [roleId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting role by ID:', error);
    throw error;
  }
}

/**
 * Create a new role
 * @param {Object} roleData - Role data (name, description)
 * @returns {Promise<Object>} Created role object
 */
async function createRole(roleData) {
  try {
    const { name, description } = roleData;
    const [result] = await pool.execute(
      `INSERT INTO roles (name, description) VALUES (?, ?)`,
      [name, description || null]
    );
    return getRoleById(result.insertId);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}

/**
 * Update role
 * @param {number} roleId - Role ID
 * @param {Object} roleData - Role data to update (name, description)
 * @returns {Promise<Object>} Updated role object
 */
async function updateRole(roleId, roleData) {
  try {
    const { name, description } = roleData;
    await pool.execute(
      `UPDATE roles SET name = ?, description = ? WHERE id = ?`,
      [name, description || null, roleId]
    );
    return getRoleById(roleId);
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
}

/**
 * Delete role
 * @param {number} roleId - Role ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteRole(roleId) {
  try {
    const [result] = await pool.execute(
      `DELETE FROM roles WHERE id = ?`,
      [roleId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
}

/**
 * Update role permissions
 * @param {number} roleId - Role ID
 * @param {Array<number>} permissionIds - Array of permission IDs
 * @returns {Promise<boolean>} True if updated
 */
async function updateRolePermissions(roleId, permissionIds) {
  try {
    // Start transaction by deleting existing permissions
    await pool.execute(
      `DELETE FROM role_permissions WHERE role_id = ?`,
      [roleId]
    );

    // Insert new permissions
    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map(() => '(?, ?)').join(', ');
      const params = permissionIds.flatMap(permId => [roleId, permId]);
      await pool.execute(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
        params
      );
    }

    return true;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    throw error;
  }
}

module.exports = {
  getRolePermissions,
  getUserPermissions,
  hasPermission,
  getAllRoles,
  getRoleByName,
  getRoleById,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
};

