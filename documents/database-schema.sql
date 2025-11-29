-- Database schema for Apartment Maintenance Application
-- Run this SQL script to create the required tables

CREATE DATABASE IF NOT EXISTS apartment_maintenance;
USE apartment_maintenance;

-- Expense table
CREATE TABLE IF NOT EXISTS expense (
  id VARCHAR(255) PRIMARY KEY,
  month VARCHAR(50) NOT NULL,
  date VARCHAR(50) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  amount FLOAT NOT NULL,
  paymentMode VARCHAR(100),
  paidBy VARCHAR(255),
  type VARCHAR(100),
  deductionSource VARCHAR(100),
  subType VARCHAR(100),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_month (month),
  INDEX idx_createdAt (createdAt)
);

-- Collection table
CREATE TABLE IF NOT EXISTS collection (
  id VARCHAR(255) PRIMARY KEY,
  month VARCHAR(50) NOT NULL,
  date VARCHAR(50) NOT NULL,
  type VARCHAR(100),
  subType VARCHAR(100),
  flatNumber VARCHAR(100),
  category VARCHAR(255),
  amount FLOAT NOT NULL,
  paymentMode VARCHAR(100),
  collectedBy VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_month (month),
  INDEX idx_createdAt (createdAt)
);

