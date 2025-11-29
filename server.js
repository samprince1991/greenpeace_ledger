require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');

// Import routes
const indexRoutes = require('./routes/index');
const healthRoutes = require('./routes/health');
const expenseRoutes = require('./routes/expenses');
const collectionRoutes = require('./routes/collections');
const summaryRoutes = require('./routes/summary');

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files - serve from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve config files from config directory
app.use('/config', express.static(path.join(__dirname, 'config')));

// Routes
app.use('/', indexRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/summary', summaryRoutes);

// 404 handler for API routes
app.use('/api', notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


