const userService = require('../models/userService');

/**
 * Middleware to check if user has Admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function requireAdmin(req, res, next) {
  // Check if user is authenticated
  if (!req.session || !req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/auth/login');
  }

  try {
    // Check if user has Admin role (include inactive users for admin check)
    const user = await userService.findById(req.session.userId, true);
    if (!user || user.role_name !== 'Admin') {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      return res.status(403).send('Access denied. Admin privileges required.');
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(500).send('Internal server error');
  }
}

module.exports = {
  requireAdmin
};

