-- Fix admin password hash
-- Run this SQL to update the admin user password hash
-- Default password: admin

USE apartment_maintenance;

UPDATE users 
SET password_hash = '$2b$10$f0iNjd8YtoYelW9wEZ9hX.nyXW8YkOg8.ZCqJAPX9ZjeAeT5Wjj2.'
WHERE username = 'admin';

