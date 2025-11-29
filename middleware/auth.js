const userService = require('../models/userService');

/**
 * Middleware to check if user is authenticated
 * Redirects to /login if not authenticated
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // For API routes, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // For page routes, redirect to login
  res.redirect('/auth/login');
}

/**
 * Middleware to check if user is authenticated (optional)
 * Doesn't redirect, just sets req.user if available
 */
async function optionalAuth(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const user = await userService.findById(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Error loading user in optionalAuth:', error);
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};

