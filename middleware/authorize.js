const roleService = require('../models/roleService');

/**
 * Middleware to check if user has a specific permission
 * @param {string} permissionName - Permission name to check
 * @returns {Function} Express middleware function
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/auth/login');
    }

    try {
      const hasPermission = await roleService.hasPermission(
        req.session.userId,
        permissionName
      );

      if (!hasPermission) {
        if (req.path.startsWith('/api/')) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return res.status(403).send('Access denied. Insufficient permissions.');
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(500).send('Internal server error');
    }
  };
}

/**
 * Middleware to check if user has any of the specified permissions
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Function} Express middleware function
 */
function requireAnyPermission(permissionNames) {
  return async (req, res, next) => {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/auth/login');
    }

    try {
      const userPermissions = await roleService.getUserPermissions(req.session.userId);
      const permissionNamesSet = new Set(userPermissions.map(p => p.name));
      
      const hasAnyPermission = permissionNames.some(name => permissionNamesSet.has(name));

      if (!hasAnyPermission) {
        if (req.path.startsWith('/api/')) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return res.status(403).send('Access denied. Insufficient permissions.');
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(500).send('Internal server error');
    }
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission
};

