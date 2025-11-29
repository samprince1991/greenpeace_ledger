const userService = require('../models/userService');
const roleService = require('../models/roleService');

// ========== User Management ==========

/**
 * Render users management page
 */
async function renderUsers(req, res) {
  try {
    const roles = await roleService.getAllRoles();
    res.render('admin/users', { 
      user: {
        username: req.session.username,
        roleName: req.session.roleName
      },
      roles
    });
  } catch (error) {
    console.error('Error rendering users page:', error);
    res.status(500).send('Error loading users page');
  }
}

/**
 * Get all users
 */
async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Create a new user
 */
async function createUser(req, res) {
  try {
    const { username, password, role_id } = req.body;

    if (!username || !password || !role_id) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Check if username already exists
    const existingUser = await userService.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await userService.createUser({ username, password, role_id });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Update user
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, role_id, is_active, password } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) updateData.password = password;

    const user = await userService.updateUser(id, updateData);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Delete user
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deleted = await userService.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// ========== Role Management ==========

/**
 * Render roles management page
 */
async function renderRoles(req, res) {
  try {
    res.render('admin/roles', { 
      user: {
        username: req.session.username,
        roleName: req.session.roleName
      }
    });
  } catch (error) {
    console.error('Error rendering roles page:', error);
    res.status(500).send('Error loading roles page');
  }
}

/**
 * Get all roles
 */
async function getRoles(req, res) {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

/**
 * Create a new role
 */
async function createRole(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const role = await roleService.createRole({ name, description });
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * Update role
 */
async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const role = await roleService.updateRole(id, { name, description });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
}

/**
 * Delete role
 */
async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    // Prevent deleting Admin role
    const role = await roleService.getRoleById(id);
    if (role && role.name === 'Admin') {
      return res.status(400).json({ error: 'Cannot delete Admin role' });
    }

    const deleted = await roleService.deleteRole(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }
    res.status(500).json({ error: 'Failed to delete role' });
  }
}

/**
 * Get role permissions
 */
async function getRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const permissions = await roleService.getRolePermissions(id);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
}

/**
 * Update role permissions
 */
async function updateRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ error: 'permission_ids must be an array' });
    }

    await roleService.updateRolePermissions(id, permission_ids);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

// ========== Permission Management ==========

/**
 * Render permissions management page
 */
async function renderPermissions(req, res) {
  try {
    res.render('admin/permissions', { 
      user: {
        username: req.session.username,
        roleName: req.session.roleName
      }
    });
  } catch (error) {
    console.error('Error rendering permissions page:', error);
    res.status(500).send('Error loading permissions page');
  }
}

/**
 * Get all permissions
 */
async function getPermissions(req, res) {
  try {
    const permissions = await roleService.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

module.exports = {
  // Users
  renderUsers,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  // Roles
  renderRoles,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  // Permissions
  renderPermissions,
  getPermissions
};

