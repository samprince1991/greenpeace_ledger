const userService = require('../models/userService');
const roleService = require('../models/roleService');

/**
 * Render login page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function renderLogin(req, res) {
  // If already logged in, redirect to home
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  
  res.render('login', { 
    error: req.query.error || null,
    message: req.query.message || null
  });
}

/**
 * Handle login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

    // Validate input
    if (!username || !password) {
      return res.redirect('/auth/login?error=' + encodeURIComponent('Username and password are required'));
    }

    // Find user
    const user = await userService.findByUsername(username);
    if (!user) {
      console.log('User not found:', username);
      return res.redirect('/auth/login?error=' + encodeURIComponent('Invalid username or password'));
    }

    console.log('User found, verifying password...');

    // Verify password
    const isValidPassword = await userService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.redirect('/auth/login?error=' + encodeURIComponent('Invalid username or password'));
    }

    console.log('Password verified, setting session...');

    // Get user permissions
    const permissions = await roleService.getUserPermissions(user.id);
    const permissionNames = permissions.map(p => p.name);

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.roleName = user.role_name;
    req.session.permissions = permissionNames;

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.redirect('/auth/login?error=' + encodeURIComponent('Session error. Please try again.'));
      }
      
      // Redirect to home or original destination
      const redirectTo = req.query.redirect || '/';
      res.redirect(redirectTo);
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.redirect('/auth/login?error=' + encodeURIComponent('An error occurred during login'));
  }
}

/**
 * Handle logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    res.redirect('/auth/login?message=' + encodeURIComponent('Logged out successfully'));
  });
}

module.exports = {
  renderLogin,
  login,
  logout
};

