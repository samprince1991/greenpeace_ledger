// Google Sheets API Service
class GoogleSheetsService {
    constructor() {
        this.tokenClient = null;
        this.gapiLoaded = false;
        this.gisLoaded = false;
        this.authResolve = null;
        this.authReject = null;
    }

    // Initialize Google API
    async initialize() {
        return new Promise((resolve, reject) => {
            // Load Google API script
            if (!window.gapi) {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    window.gapi.load('client', () => {
                        this.gapiLoaded = true;
                        this.initializeGapi().then(resolve).catch(reject);
                    });
                };
                script.onerror = () => reject(new Error('Failed to load Google API'));
                document.head.appendChild(script);
            } else {
                this.initializeGapi().then(resolve).catch(reject);
            }

            // Load Google Identity Services script
            if (!window.google || !window.google.accounts) {
                const script2 = document.createElement('script');
                script2.src = 'https://accounts.google.com/gsi/client';
                script2.onload = () => {
                    this.gisLoaded = true;
                };
                script2.onerror = () => {
                    console.warn('Failed to load Google Identity Services');
                };
                document.head.appendChild(script2);
            } else {
                this.gisLoaded = true;
            }
        });
    }

    async initializeGapi() {
        try {
            await window.gapi.client.init({
                apiKey: GOOGLE_SHEETS_CONFIG.API_KEY,
                discoveryDocs: GOOGLE_SHEETS_CONFIG.DISCOVERY_DOCS
            });

            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_SHEETS_CONFIG.CLIENT_ID,
                scope: GOOGLE_SHEETS_CONFIG.SCOPES,
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response.error);
                        if (this.authReject) {
                            this.authReject(new Error(response.error));
                        }
                        if (typeof showNotification !== 'undefined') {
                            showNotification('Authentication failed. Please try again.', 'error');
                        }
                    } else {
                        this.handleAuthResponse(response);
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing GAPI:', error);
            throw error;
        }
    }

    // Authenticate user
    async authenticate() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Google API not initialized. Please wait a moment and try again.'));
                return;
            }

            this.authResolve = resolve;
            this.authReject = reject;
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    handleAuthResponse(response) {
        if (response.access_token) {
            window.gapi.client.setToken(response);
            if (this.authResolve) {
                this.authResolve(response);
            }
            // Update auth button if function exists
            if (typeof updateAuthButton === 'function') {
                updateAuthButton();
            }
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        try {
            const token = window.gapi.client.getToken();
            return token !== null && token !== undefined;
        } catch (error) {
            return false;
        }
    }

    // Get all expenses from Google Sheets
    async getAllExpenses() {
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Expenses!A2:L10000' // Adjust range as needed
            });

            const rows = response.result.values || [];
            return this.parseExpenses(rows);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    }

    // Get all collections from Google Sheets
    async getAllCollections() {
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Collections!A2:M10000'
            });

            const rows = response.result.values || [];
            return this.parseCollections(rows);
        } catch (error) {
            console.error('Error fetching collections:', error);
            throw error;
        }
    }

    // Add expense to Google Sheets
    async addExpense(expenseData) {
        try {
            const row = [
                expenseData.id || this.generateId(),
                expenseData.month || '',
                expenseData.date || '',
                expenseData.category || '',
                expenseData.description || '',
                expenseData.amount || 0,
                expenseData.paymentMode || '',
                expenseData.type || 'expense',
                expenseData.deductionSource || 'maintenance',
                expenseData.subType || expenseData.deductionSource || 'maintenance',
                expenseData.createdAt || new Date().toISOString()
            ];

            const response = await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Expenses!A:L',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [row]
                }
            });

            return { success: true, expense: expenseData };
        } catch (error) {
            console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
    }

    // Add collection to Google Sheets
    async addCollection(collectionData) {
        try {
            const row = [
                collectionData.id || this.generateId(),
                collectionData.month || '',
                collectionData.date || '',
                collectionData.type || '',
                collectionData.subType || '',
                collectionData.flatNumber || '',
                collectionData.category || collectionData.flatNumber || '',
                collectionData.amount || 0,
                collectionData.description || '',
                collectionData.paymentMode || '',
                collectionData.collectedBy || APP_CONFIG.DEFAULTS.COLLECTED_BY,
                collectionData.createdAt || new Date().toISOString()
            ];

            const response = await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Collections!A:M',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [row]
                }
            });

            return { success: true, collection: collectionData };
        } catch (error) {
            console.error('Error adding collection:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete expense from Google Sheets
    async deleteExpense(id) {
        try {
            // First, find the row number
            const expenses = await this.getAllExpenses();
            const expenseIndex = expenses.findIndex(e => e.id === id);
            
            if (expenseIndex === -1) {
                return { success: false, error: 'Expense not found' };
            }

            // Delete row (row number = expenseIndex + 2 because header is row 1, and arrays are 0-indexed)
            const rowNumber = expenseIndex + 2;
            const sheetId = await this.getSheetId('Expenses');
            
            if (!sheetId) {
                return { success: false, error: 'Sheet not found' };
            }
            
            await window.gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowNumber - 1,
                                endIndex: rowNumber
                            }
                        }
                    }]
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting expense:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete collection from Google Sheets
    async deleteCollection(id) {
        try {
            const collections = await this.getAllCollections();
            const collectionIndex = collections.findIndex(c => c.id === id);
            
            if (collectionIndex === -1) {
                return { success: false, error: 'Collection not found' };
            }

            const rowNumber = collectionIndex + 2;
            const sheetId = await this.getSheetId('Collections');
            
            if (!sheetId) {
                return { success: false, error: 'Sheet not found' };
            }
            
            await window.gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowNumber - 1,
                                endIndex: rowNumber
                            }
                        }
                    }]
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting collection:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper: Parse expense rows
    parseExpenses(rows) {
        return rows.map(row => ({
            id: row[0] || '',
            month: row[1] || '',
            date: row[2] || '',
            category: row[3] || '',
            description: row[4] || '',
            amount: parseFloat(row[5]) || 0,
            paymentMode: row[6] || '',
            type: row[7] || 'expense',
            deductionSource: row[8] || 'maintenance',
            subType: row[9] || row[8] || 'maintenance',
            createdAt: row[10] || new Date().toISOString()
        }));
    }

    // Helper: Parse collection rows
    parseCollections(rows) {
        return rows.map(row => ({
            id: row[0] || '',
            month: row[1] || '',
            date: row[2] || '',
            type: row[3] || '',
            subType: row[4] || '',
            flatNumber: row[5] || '',
            category: row[6] || row[5] || '',
            amount: parseFloat(row[7]) || 0,
            description: row[8] || '',
            paymentMode: row[9] || '',
            collectedBy: row[10] || APP_CONFIG.DEFAULTS.COLLECTED_BY,
            createdAt: row[11] || new Date().toISOString()
        }));
    }

    // Helper: Get sheet ID by name
    async getSheetId(sheetName) {
        try {
            const response = await window.gapi.client.sheets.spreadsheets.get({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID
            });

            const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
            return sheet ? sheet.properties.sheetId : null;
        } catch (error) {
            console.error('Error getting sheet ID:', error);
            return null;
        }
    }

    // Helper: Generate unique ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Migrate data from localStorage to Google Sheets
    async migrateFromLocalStorage() {
        try {
            // Get all data from localStorage
            const expenses = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.EXPENSES) || '[]');
            const collections = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COLLECTIONS) || '[]');
            const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || '{}');

            let migratedCount = 0;

            // Migrate expenses
            for (const expense of expenses) {
                const result = await this.addExpense(expense);
                if (result.success) migratedCount++;
            }

            // Migrate collections
            for (const collection of collections) {
                const result = await this.addCollection(collection);
                if (result.success) migratedCount++;
            }

            // Migrate settings
            if (settings.MaintenancePerFlat) {
                await this.updateSettings('MaintenancePerFlat', settings.MaintenancePerFlat);
            }

            if (typeof showNotification !== 'undefined') {
                showNotification(`Data migrated successfully! ${migratedCount} records migrated to Google Sheets.`, 'success');
            }
            return { success: true, count: migratedCount };
        } catch (error) {
            console.error('Migration error:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Migration failed: ' + error.message, 'error');
            }
            return { success: false, error: error.message };
        }
    }

    // Update settings
    async updateSettings(key, value) {
        try {
            // First check if setting exists
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Settings!A2:C100'
            });

            const rows = response.result.values || [];
            const rowIndex = rows.findIndex(row => row[0] === key);

            if (rowIndex !== -1) {
                // Update existing setting
                const rowNumber = rowIndex + 2;
                await window.gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                    range: `Settings!B${rowNumber}:C${rowNumber}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[value, new Date().toISOString()]]
                    }
                });
            } else {
                // Add new setting
                await window.gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                    range: 'Settings!A:C',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[key, value, new Date().toISOString()]]
                    }
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Get settings
    async getSettings() {
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
                range: 'Settings!A2:C100'
            });

            const rows = response.result.values || [];
            const settings = {};
            
            rows.forEach(row => {
                if (row[0] && row[1]) {
                    settings[row[0]] = row[1];
                }
            });

            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }
}

// Initialize Google Sheets Service
const googleSheetsService = new GoogleSheetsService();

