# Apartment Maintenance Web App

A simple, lightweight web application for tracking monthly maintenance expenses across 8 apartments using **localStorage** (browser-based storage) as the database.

## Features

- ✅ Add monthly expenses with categories (Electricity, Water, Security, Cleaning, Repair, Other)
- ✅ Add collections per flat (Maintenance and Corpus Amount separately)
- ✅ Monthly summary dashboard showing total collected (maintenance), corpus, expenses, and balance
- ✅ Separate collection lists for Maintenance and Corpus
- ✅ Expense listing table for selected month
- ✅ Monthly reports with summary and detailed breakdown
- ✅ CSV export functionality
- ✅ JSON export/import for data backup
- ✅ Configurable maintenance amount per flat
- ✅ Month selection using Flatpickr month picker
- ✅ Flat names: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
- ✅ Month format: "MonthName-YYYY" (e.g., "June-2025")
- ✅ Mobile responsive design
- ✅ Works offline - no server required!
- ✅ No authentication needed

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript
- **Styling**: Tailwind CSS (CDN)
- **Date Picker**: Flatpickr with MonthSelect Plugin
- **Database**: Browser localStorage (file-based storage)

## Quick Start

1. **Download the files** to your computer
2. **Open `index.html`** in your web browser
   - Double-click the file, or
   - Right-click → Open with → Your preferred browser
3. **Start using the app!** All data is stored locally in your browser

That's it! No setup, no server, no configuration needed.

## Usage

### Adding Collections

1. Fill in the "Add Collection (Per Flat)" form:
   - **Month**: Use the month picker (e.g., June-2025)
   - **Date**: Select the collection date
   - **Type**: Choose "Maintenance" or "Corpus Amount"
   - **Flat Number**: Select from 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
   - **Amount**: Enter amount in ₹
   - **Collected By**: Enter name of person who collected
   - **Payment Mode**: Select Cash/UPI/Bank
2. Click **Add Collection**
3. Collections are separated into Maintenance and Corpus sections

### Adding Expenses

1. Fill in the "Add New Expense" form:
   - **Month**: Use the month picker (e.g., June-2025)
   - **Date**: Select the expense date
   - **Category**: Choose from dropdown
   - **Description**: Enter expense details
   - **Amount**: Enter amount in ₹
   - **Paid By**: Enter name of person who paid
   - **Payment Mode**: Select Cash/UPI/Bank
2. Click **Add Expense**
3. The expense will be saved and appear in the expense list immediately

### Viewing Monthly Summary

1. Use the month selector at the top (Flatpickr month picker)
2. The dashboard will automatically show:
   - **Total Collected**: Sum of Maintenance collections only
   - **Total Corpus**: Sum of Corpus Amount collections (separate fund)
   - **Total Expenses**: Sum of all expenses
   - **Remaining Balance**: Maintenance - Expenses (corpus is not included in balance)

### Generating Reports

1. Go to the "Monthly Reports" section
2. Select a month from the dropdown
3. Click **Generate Monthly Report**
4. View the summary and detailed expense table
5. Click **Export to CSV** to download a CSV file

### Updating Settings

1. Go to the "Settings" section
2. Enter the new monthly maintenance amount per flat
3. Click **Save**
4. The total collection will update automatically

### Data Backup & Restore

**Export Data (Backup):**
1. Go to Settings section
2. Click **Export Data (JSON)**
3. A JSON file will be downloaded with all your expenses, collections, and settings
4. Keep this file safe as a backup

**Import Data (Restore):**
1. Go to Settings section
2. Click **Import Data (JSON)**
3. Select your previously exported JSON file
4. Your data will be restored and the page will refresh

## How It Works

### Data Storage

The app uses **localStorage** - a built-in browser feature that stores data locally on your device. This means:

- ✅ **No server required** - works completely offline
- ✅ **Fast** - instant data access
- ✅ **Private** - data stays on your device
- ✅ **Persistent** - data survives browser restarts

### Data Structure

Data is stored in three localStorage keys:

1. **`apartment_maintenance_expenses`**: Array of all expense records
2. **`apartment_maintenance_settings`**: Settings object (maintenance amount, etc.)
3. **`apartment_maintenance_collections`**: Array of all collection records

Each expense record contains:
```javascript
{
  id: "unique-id",
  month: "June-2025",
  date: "2025-06-15",
  category: "Electricity",
  description: "Monthly bill",
  amount: 5000,
  paidBy: "John",
  paymentMode: "UPI",
  createdAt: "2025-06-15T10:30:00.000Z"
}
```

Each collection record contains:
```javascript
{
  id: "unique-id",
  month: "June-2025",
  date: "2025-06-15",
  type: "Maintenance", // or "Corpus Amount"
  flatNumber: "1A",
  amount: 2000,
  collectedBy: "Jane",
  paymentMode: "Cash",
  createdAt: "2025-06-15T10:30:00.000Z"
}
```

## File Structure

```
ApartmentMaintanance/
├── index.html          # Main HTML file with UI
├── script.js           # Frontend JavaScript with localStorage logic
└── README.md           # This file
```

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Edge, Safari)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Requires JavaScript enabled
- ✅ Works on desktop and mobile devices

## Data Persistence

- Data is stored in your browser's localStorage
- Data persists across browser sessions
- **Important**: If you clear browser data/cache, your data will be lost
- **Solution**: Regularly export your data using the "Export Data (JSON)" feature

## Key Features Explained

### Month Format
- Uses "MonthName-YYYY" format (e.g., "June-2025")
- Month selection via Flatpickr month picker
- Easy to read and understand

### Flat Names
- Uses alphanumeric format: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
- Total of 8 flats (4 floors × 2 flats per floor)

### Collections
- **Maintenance Collections**: Regular monthly maintenance payments
- **Corpus Collections**: Separate fund for other works (not included in balance calculation)
- Collections are displayed in separate tables for clarity

### Balance Calculation
- **Remaining Balance = Total Maintenance Collections - Total Expenses**
- Corpus Amount is NOT included in balance (it's a separate fund)
- Balance can be negative (red) if expenses exceed collections

## Limitations & Notes

### localStorage Limitations:
- **Browser-specific**: Data is stored per browser/device
- **Storage limit**: ~5-10MB per domain (plenty for this app)
- **Not shared**: Data on one device/browser doesn't sync to others
- **Can be cleared**: Clearing browser data will delete your data

### If You Need Multi-Device Access:

If you need to access your data from multiple devices or share it with others, you have a few options:

1. **Use the Export/Import feature**: Export JSON on one device, import on another
2. **Use a cloud storage service**: Store the exported JSON file in Google Drive/Dropbox
3. **Deploy a simple backend**: Create a simple Node.js server with file-based storage

## Troubleshooting

### Data Not Appearing
- Check if JavaScript is enabled in your browser
- Open browser console (F12) to check for errors
- Try refreshing the page
- Verify the month selector matches the month in your data

### Month Picker Not Working
- Ensure you have internet connection (for Flatpickr CDN)
- Check browser console (F12) for errors
- Try clearing browser cache and reloading

### Data Lost After Browser Update
- localStorage data should persist, but if lost, restore from your JSON backup
- Always keep regular backups using the Export feature

### Export/Import Not Working
- Make sure you're using a modern browser
- Check browser console (F12) for errors
- Try a different browser if issues persist

### App Not Loading
- Ensure you have internet connection (for Tailwind CSS and Flatpickr CDN)
- Check browser console (F12) for errors
- Try clearing browser cache and reloading

## Security Note

- All data is stored locally in your browser
- No data is sent to any server (except CDN for styling and date picker)
- Your data is completely private and secure
- For sensitive data, consider using browser's private/incognito mode with caution (data may be cleared)

## Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Try exporting your data as backup
3. Clear browser cache and reload
4. Try a different browser

## Credits

- **Tailwind CSS**: For styling
- **Flatpickr**: For month selection
- Built with vanilla JavaScript for simplicity and performance

