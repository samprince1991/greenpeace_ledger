const roleService = require('../models/roleService');

/**
 * Render the main index page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function renderIndex(req, res) {
  // Configuration derived from environment with sane defaults
  const appConfig = {
    currencyCode: process.env.APP_CURRENCY_CODE || 'INR',
    currencyLocale: process.env.APP_CURRENCY_LOCALE || 'en-IN',
    defaultCollectedBy: process.env.APP_DEFAULT_COLLECTED_BY || 'Admin',
    uiNotificationTimeoutMs: Number(process.env.UI_NOTIFICATION_TIMEOUT_MS) || 3000,
    uiRecentActivityLimit: Number(process.env.UI_RECENT_ACTIVITY_LIMIT) || 5,
    uiMaxDescriptionLength: Number(process.env.UI_MAX_DESCRIPTION_WIDTH) || 200
  };

  // Get user info from session
  const user = {
    id: req.session.userId,
    username: req.session.username,
    roleName: req.session.roleName
  };

  // Get user permissions
  let permissions = [];
  let permissionNames = [];
  
  if (req.session.userId) {
    try {
      permissions = await roleService.getUserPermissions(req.session.userId);
      permissionNames = permissions.map(p => p.name);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  }

  res.render('index', { 
    appConfig,
    user,
    permissions: permissionNames
  });
}

module.exports = {
  renderIndex
};

