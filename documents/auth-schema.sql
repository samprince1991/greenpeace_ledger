-- Authentication and Permissions Schema
-- Run this SQL script to create the required tables for authentication

USE apartment_maintenance;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Role-Permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_username (username),
  INDEX idx_role_id (role_id),
  INDEX idx_is_active (is_active)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full access to all features'),
  ('Secretary', 'Can view, add, and edit but cannot delete'),
  ('Viewer', 'Read-only access to view data')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('view_all', 'dashboard', 'view', 'View dashboard and all data'),
  ('add_collection', 'collection', 'add', 'Add new collections'),
  ('add_expense', 'expense', 'add', 'Add new expenses'),
  ('edit_collection', 'collection', 'edit', 'Edit existing collections'),
  ('edit_expense', 'expense', 'edit', 'Edit existing expenses'),
  ('delete_collection', 'collection', 'delete', 'Delete collections'),
  ('delete_expense', 'expense', 'delete', 'Delete expenses'),
  ('view_reports', 'reports', 'view', 'View reports section')
ON DUPLICATE KEY UPDATE name=name;

-- Assign permissions to Admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Secretary role (view, add, edit - no delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Secretary'
  AND p.name IN ('view_all', 'add_collection', 'add_expense', 'edit_collection', 'edit_expense', 'view_reports')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Viewer role (view only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer'
  AND p.name IN ('view_all', 'view_reports')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Create default admin user (password: 'admin' - MUST BE CHANGED)
-- Password hash is for 'admin' using bcrypt with 10 salt rounds
-- To generate a new hash, use: bcrypt.hashSync('your_password', 10)
INSERT INTO users (id, username, password_hash, role_id, is_active) VALUES
  (UUID(), 'admin', '$2b$10$f0iNjd8YtoYelW9wEZ9hX.nyXW8YkOg8.ZCqJAPX9ZjeAeT5Wjj2.', 
   (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1), TRUE)
ON DUPLICATE KEY UPDATE username=username;

