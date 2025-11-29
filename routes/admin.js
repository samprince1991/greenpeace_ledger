const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// User Management
router.get('/users', adminController.renderUsers);
router.get('/api/users', adminController.getUsers);
router.post('/api/users', adminController.createUser);
router.put('/api/users/:id', adminController.updateUser);
router.delete('/api/users/:id', adminController.deleteUser);

// Role Management
router.get('/roles', adminController.renderRoles);
router.get('/api/roles', adminController.getRoles);
router.post('/api/roles', adminController.createRole);
router.put('/api/roles/:id', adminController.updateRole);
router.delete('/api/roles/:id', adminController.deleteRole);
router.get('/api/roles/:id/permissions', adminController.getRolePermissions);
router.post('/api/roles/:id/permissions', adminController.updateRolePermissions);

// Permission Management
router.get('/permissions', adminController.renderPermissions);
router.get('/api/permissions', adminController.getPermissions);

module.exports = router;

