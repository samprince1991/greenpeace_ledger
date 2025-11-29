# Google Sheets Setup Guide

## Quick Setup Instructions

### Step 1: Configure Your Credentials

1. Open `config/google-sheets-config.js`
2. Replace the placeholder values with your actual credentials:

```javascript
const GOOGLE_SHEETS_CONFIG = {
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE', // Your OAuth 2.0 Client ID
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', // Your Google Spreadsheet ID
    API_KEY: 'YOUR_API_KEY_HERE', // Your API Key
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
};
```

### Step 2: Get Your Credentials from Google Cloud Console

#### Getting Client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** under "OAuth 2.0 Client IDs"
5. Copy the **Client ID** value

#### Getting API Key:
1. In the same **Credentials** page
2. Find or create an **API Key**
3. Copy the API Key value
4. (Optional) Restrict the API Key to "Google Sheets API" for security

#### Getting Spreadsheet ID:
1. Open your Google Spreadsheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` part (the long string between `/d/` and `/edit`)

### Step 3: Set Up Your Google Spreadsheet

Your spreadsheet should have **3 sheets** with the following column headers:

#### Sheet 1: "Expenses"
| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I | Column J | Column K |
|----------|----------|-----------|-----------|----------|----------|----------|----------|----------|----------|----------|
| id | month | date | category | description | amount | paymentMode | type | deductionSource | subType | createdAt |

#### Sheet 2: "Collections"
| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I | Column J | Column K | Column L |
|----------|----------|-----------|-----------|----------|----------|----------|----------|----------|----------|----------|----------|
| id | month | date | type | subType | flatNumber | category | amount | description | paymentMode | collectedBy | createdAt |

#### Sheet 3: "Settings"
| Column A | Column B | Column C |
|----------|----------|----------|
| key | value | updatedAt |

**Important:** 
- The first row should contain the column headers (as shown above)
- Data will start from row 2
- Make sure the sheet names match exactly: "Expenses", "Collections", "Settings"

### Step 4: Share Your Spreadsheet

1. Open your Google Spreadsheet
2. Click **Share** button (top right)
3. Make sure the spreadsheet is accessible to the Google account you'll use to authenticate
4. For testing, you can share it with your own Google account

### Step 5: Test the Application

1. Open `index.html` in your browser
2. Click the **"Sign In"** button in the top navigation
3. Authenticate with your Google account
4. The button should change to **"Signed In"** (green)
5. Try adding a collection or expense to verify it's working

### Step 6: Migrate Existing Data (Optional)

If you have existing data in localStorage:

1. Make sure you're authenticated
2. Go to the **Reports** tab
3. Click **"Migrate from localStorage"** button
4. Confirm the migration
5. Your data will be copied to Google Sheets

## Troubleshooting

### "Authentication failed" error
- Make sure your Client ID is correct
- Check that you've enabled Google Sheets API in Google Cloud Console
- Verify your OAuth consent screen is configured

### "Error loading expenses/collections"
- Check that your Spreadsheet ID is correct
- Verify the sheet names match exactly: "Expenses", "Collections", "Settings"
- Make sure the column headers are in the first row
- Check that you've shared the spreadsheet with your Google account

### "API key not valid" error
- Verify your API Key is correct
- Make sure Google Sheets API is enabled in your project
- Check if the API Key has restrictions that might block access

### Data not appearing
- Make sure you're authenticated (check the Sign In button)
- Verify data exists in your Google Spreadsheet
- Check browser console (F12) for error messages

## Security Notes

⚠️ **Important:** 
- Never commit your credentials to version control
- Keep your API Key and Client ID private
- Consider restricting your API Key to specific domains/IPs in production
- The `config/google-sheets-config.js` file should be added to `.gitignore` if you're using git

## Next Steps

After setup is complete:
1. Test all CRUD operations (Create, Read, Update, Delete)
2. Verify data is being saved to Google Sheets
3. Test on different devices/browsers
4. Consider setting up automated backups


