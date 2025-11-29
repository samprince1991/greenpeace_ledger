require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

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

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files - serve everything in project root (index assets, config, script.js)
app.use(express.static(path.join(__dirname)));

// Root route - render main app shell
app.get('/', (req, res) => {
  // Configuration derived from environment with sane defaults
  const appConfig = {
    currencyCode: process.env.APP_CURRENCY_CODE || 'INR',
    currencyLocale: process.env.APP_CURRENCY_LOCALE || 'en-IN',
    defaultCollectedBy: process.env.APP_DEFAULT_COLLECTED_BY || 'Admin',
    uiNotificationTimeoutMs: Number(process.env.UI_NOTIFICATION_TIMEOUT_MS) || 3000,
    uiRecentActivityLimit: Number(process.env.UI_RECENT_ACTIVITY_LIMIT) || 5,
    uiMaxDescriptionLength: Number(process.env.UI_MAX_DESCRIPTION_WIDTH) || 200
  };

  res.render('index', { appConfig });
});

// ============================
// API Routes (JSON)
// ============================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error', error: 'Database not reachable' });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  const { month } = req.query;
  try {
    let query = 'SELECT * FROM expense';
    const params = [];
    
    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const [expenses] = await pool.query(query, params);
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const {
    month,
    date,
    category,
    description,
    amount,
    paymentMode,
    paidBy,
    type,
    deductionSource,
    subType
  } = req.body;

  if (!month || !date || amount == null) {
    return res.status(400).json({ error: 'month, date and amount are required' });
  }

  try {
    // Generate a unique ID (similar to cuid)
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    await pool.query(
      `INSERT INTO expense (id, month, date, category, description, amount, paymentMode, paidBy, type, deductionSource, subType, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        month,
        date,
        category || null,
        description || null,
        parseFloat(amount),
        paymentMode || null,
        paidBy || null,
        type || 'expense',
        deductionSource || null,
        subType || null
      ]
    );
    
    const [rows] = await pool.query('SELECT * FROM expense WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM expense WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Collections
app.get('/api/collections', async (req, res) => {
  const { month } = req.query;
  try {
    let query = 'SELECT * FROM collection';
    const params = [];
    
    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const [collections] = await pool.query(query, params);
    res.json(collections);
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

app.post('/api/collections', async (req, res) => {
  const {
    month,
    date,
    type,
    subType,
    flatNumber,
    category,
    amount,
    paymentMode,
    collectedBy
  } = req.body;

  if (!month || !date || amount == null) {
    return res.status(400).json({ error: 'month, date and amount are required' });
  }

  try {
    // Generate a unique ID (similar to cuid)
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    await pool.query(
      `INSERT INTO collection (id, month, date, type, subType, flatNumber, category, amount, paymentMode, collectedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        month,
        date,
        type || null,
        subType || null,
        flatNumber || null,
        category || flatNumber || null,
        parseFloat(amount),
        paymentMode || null,
        collectedBy || null
      ]
    );
    
    const [rows] = await pool.query('SELECT * FROM collection WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM collection WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Summary endpoint (optional usage)
app.get('/api/summary', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'month query parameter is required (e.g. 2025-06)' });
  }

  try {
    const [expenses] = await pool.query('SELECT * FROM expense WHERE month = ?', [month]);
    const [collections] = await pool.query('SELECT * FROM collection WHERE month = ?', [month]);

    const [allExpenses] = await pool.query('SELECT * FROM expense');
    const [allCollections] = await pool.query('SELECT * FROM collection');

    const parseAmount = (val) => {
      const num = typeof val === 'number' ? val : parseFloat(val || 0);
      return Number.isNaN(num) ? 0 : num;
    };

    const maintenanceIncome = collections
      .filter(
        (c) =>
          c.type === 'Maintenance' ||
          c.subType === 'maintenance'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    const corpusIncome = collections
      .filter(
        (c) =>
          c.type === 'Corpus' ||
          c.subType === 'corpus'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    const maintenanceExpenses = expenses.filter(
      (e) => e.deductionSource !== 'corpus' && e.subType !== 'corpus' && e.type !== 'Corpus'
    );
    const corpusExpenses = expenses.filter(
      (e) => e.deductionSource === 'corpus' || e.subType === 'corpus' || e.type === 'Corpus'
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);

    const allTimeMaintenanceIncome = allCollections
      .filter(
        (c) =>
          c.type === 'Maintenance' ||
          c.subType === 'maintenance'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    const allTimeMaintenanceExpenses = allExpenses
      .filter(
        (e) => e.deductionSource !== 'corpus' && e.subType !== 'corpus' && e.type !== 'Corpus'
      )
      .reduce((sum, e) => sum + parseAmount(e.amount), 0);

    const balance = allTimeMaintenanceIncome - allTimeMaintenanceExpenses;

    const allTimeCorpusIncome = allCollections
      .filter(
        (c) =>
          c.type === 'Corpus' ||
          c.subType === 'corpus'
      )
      .reduce((sum, c) => sum + parseAmount(c.amount), 0);

    const allTimeCorpusExpenses = allExpenses
      .filter(
        (e) => e.deductionSource === 'corpus' || e.subType === 'corpus' || e.type === 'Corpus'
      )
      .reduce((sum, e) => sum + parseAmount(e.amount), 0);

    const corpusFundBalance = allTimeCorpusIncome - allTimeCorpusExpenses;

    res.json({
      month,
      monthly: {
        maintenanceIncome,
        corpusIncome,
        totalExpenses,
        maintenanceExpenses: maintenanceExpenses.length,
        corpusExpenses: corpusExpenses.length
      },
      allTime: {
        maintenanceIncome: allTimeMaintenanceIncome,
        maintenanceExpenses: allTimeMaintenanceExpenses,
        corpusIncome: allTimeCorpusIncome,
        corpusExpenses: allTimeCorpusExpenses,
        balance,
        corpusFundBalance
      }
    });
  } catch (err) {
    console.error('Error computing summary:', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// 404 handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


