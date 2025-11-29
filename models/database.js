require('dotenv').config();
const mysql = require('mysql2/promise');

// Helper function to parse DATABASE_URL if provided
function getDbConfig() {
  if (process.env.DATABASE_URL) {
    // Parse mysql://user:password@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1) // Remove leading '/'
    };
  }
  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'apartment_maintenance'
  };
}

// MySQL connection pool
const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

