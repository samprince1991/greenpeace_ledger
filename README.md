# Apartment Maintenance Web App

A web application for tracking monthly maintenance expenses across 8 apartments using **Express.js**, **EJS**, and **MySQL**.

## Features

- ✅ Add monthly expenses with categories (Electricity, Water, Security, Cleaning, Repair, Other)
- ✅ Add collections per flat (Maintenance and Corpus Amount separately)
- ✅ Monthly summary dashboard showing total collected (maintenance), corpus, expenses, and balance
- ✅ Separate collection lists for Maintenance and Corpus
- ✅ Expense listing table for selected month
- ✅ Configurable maintenance amount per flat
- ✅ Month selection using Flatpickr month picker
- ✅ Flat names: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
- ✅ Mobile responsive design

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, Vanilla JavaScript, EJS
- **Styling**: Tailwind CSS (CDN)
- **Date Picker**: Flatpickr with MonthSelect Plugin
- **Database**: MySQL

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher, or MariaDB)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Configuration

Create a `.env` file in the project root with your database configuration:

**Option 1: Using DATABASE_URL (recommended)**
```env
DATABASE_URL="mysql://username:password@host:port/database_name"
PORT=3000
```

**Option 2: Using individual variables**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=apartment_maintenance
PORT=3000
```

### 3. Create Database Tables

Run the SQL schema file to create the required tables:

```bash
mysql -u your_username -p < database-schema.sql
```

Or manually execute the SQL commands from `database-schema.sql` in your MySQL client.

The schema will create:
- `Setting` table - for storing app settings
- `Expense` table - for storing expenses
- `Collection` table - for storing collections

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Usage

### Adding Collections

1. Fill in the "Add Collection (Per Flat)" form:
   - **Month**: Use the month picker (e.g., 2025-06)
   - **Date**: Select the collection date
   - **Type**: Choose "Maintenance" or "Corpus Amount"
   - **Flat Number**: Select from 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
   - **Amount**: Enter amount in ₹
   - **Payment Mode**: Select Cash/UPI/Bank
2. Click **Add Collection**
3. Collections are separated into Maintenance and Corpus sections

### Adding Expenses

1. Fill in the "Add New Expense" form:
   - **Month**: Use the month picker (e.g., 2025-06)
   - **Date**: Select the expense date
   - **Category**: Choose from dropdown
   - **Description**: Enter expense details
   - **Amount**: Enter amount in ₹
   - **Payment Mode**: Select Cash/UPI/Bank
   - **Deduction Source**: Choose Maintenance or Corpus
2. Click **Add Expense**
3. The expense will be saved and appear in the expense list immediately

### Viewing Monthly Summary

1. Use the month selector at the top (Flatpickr month picker)
2. The dashboard will automatically show:
   - **Current Balance**: All-time maintenance collections minus maintenance expenses
   - **Maintenance Collected**: Sum of Maintenance collections for the month
   - **Corpus Collected**: Sum of Corpus Amount collections for the month
   - **Total Expenses**: Sum of all expenses for the month
   - **Total Corpus Fund**: All-time corpus collections minus corpus expenses

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/expenses?month=YYYY-MM` - Get expenses (optional month filter)
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/collections?month=YYYY-MM` - Get collections (optional month filter)
- `POST /api/collections` - Create collection
- `DELETE /api/collections/:id` - Delete collection
- `GET /api/summary?month=YYYY-MM` - Get monthly summary

## File Structure

```
ApartmentMaintanance/
├── server.js              # Express server with API routes
├── script.js             # Frontend JavaScript
├── views/
│   └── index.ejs         # Main HTML template
├── config/
│   └── config.js         # Combined application, UI, and flats configuration
├── database-schema.sql    # Database schema
├── package.json          # Dependencies
└── README.md             # This file
```

## Database Schema

### Expense Table
- `id` (VARCHAR) - Unique identifier
- `month` (VARCHAR) - Month in YYYY-MM format
- `date` (VARCHAR) - Date in DD-MM-YYYY format
- `category` (VARCHAR) - Expense category
- `description` (TEXT) - Expense description
- `amount` (FLOAT) - Expense amount
- `paymentMode` (VARCHAR) - Payment mode
- `paidBy` (VARCHAR) - Person who paid
- `type` (VARCHAR) - Type (e.g., "expense")
- `deductionSource` (VARCHAR) - "maintenance" or "corpus"
- `subType` (VARCHAR) - For compatibility
- `createdAt` (DATETIME)

### Collection Table
- `id` (VARCHAR) - Unique identifier
- `month` (VARCHAR) - Month in YYYY-MM format
- `date` (VARCHAR) - Date in DD-MM-YYYY format
- `type` (VARCHAR) - "Maintenance" or "Corpus"
- `subType` (VARCHAR) - "maintenance" or "corpus"
- `flatNumber` (VARCHAR) - Flat number (1A, 1B, etc.)
- `category` (VARCHAR) - Category (usually same as flatNumber)
- `amount` (FLOAT) - Collection amount
- `paymentMode` (VARCHAR) - Payment mode
- `collectedBy` (VARCHAR) - Person who collected
- `createdAt` (DATETIME)

## Environment Variables

- `DATABASE_URL` - MySQL connection string (optional, if not using individual vars)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: apartment_maintenance)
- `PORT` - Server port (default: 3000)

## Troubleshooting

### Database Connection Issues
- Verify your MySQL server is running
- Check your `.env` file has correct credentials
- Ensure the database exists: `CREATE DATABASE apartment_maintenance;`
- Run the schema file to create tables

### Tables Don't Exist
- Run `database-schema.sql` to create all required tables
- Or manually create tables using the SQL commands in the schema file

### Server Won't Start
- Check if port 3000 (or your configured port) is available
- Verify all dependencies are installed: `npm install`
- Check server logs for error messages

## Security Notes

- Never commit your `.env` file to version control
- Use strong database passwords
- Consider using environment-specific configurations for production
- Keep your dependencies updated

## License

MIT
