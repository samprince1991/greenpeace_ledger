// Application Configuration
const APP_CONFIG = {
    TOTAL_FLATS: 8,
    
    
    // Currency Configuration
    CURRENCY: {
        CODE: 'INR',
        LOCALE: 'en-IN',
        MAX_FRACTION_DIGITS: 0
    },
    
    // Date Formats
    DATE_FORMATS: {
        DISPLAY: 'DD-MM-YYYY',           // Display format for dates
        MONTH_SELECTOR: 'YYYY-MM',        // Format for month selector
        MONTH_STORAGE: 'MonthName-YYYY',  // Format for storage (e.g., "January-2024")
        DATE_PICKER: 'd-m-Y'              // Format for Flatpickr date picker
    },
    
    // Month Names
    MONTH_NAMES: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ],
    
    // Collection Types
    COLLECTION_TYPES: {
        MAINTENANCE: {
            VALUE: 'maintenance',
            DISPLAY: 'Maintenance',
            TYPE: 'Maintenance'
        },
        CORPUS: {
            VALUE: 'corpus',
            DISPLAY: 'Corpus Fund',
            TYPE: 'Corpus Amount'
        }
    },
    
    // Default Values
    DEFAULTS: {
        COLLECTED_BY: 'Admin',
        COLLECTION_TYPE: 'maintenance'
    }
};

// Flats Configuration
const FLATS_CONFIG = {
    // List of all flat numbers
    FLATS: ['1A', '2A', '3A', '4A', '1B', '2B', '3B', '4B'],
    
    // Total number of flats (can be derived from FLATS.length, but kept for convenience)
    TOTAL: 8
};

// UI Configuration
const UI_CONFIG = {
    // Notification Settings
    NOTIFICATION: {
        TIMEOUT: 3000, // milliseconds
        TYPES: {
            SUCCESS: 'success',
            ERROR: 'error'
        }
    },
    
    // Display Limits
    DISPLAY_LIMITS: {
        RECENT_ACTIVITY: 5, // Number of recent transactions to show
        MAX_DESCRIPTION_LENGTH: 200 // Max width for description column
    },
    
    // Tab Names
    TABS: {
        DASHBOARD: 'dashboard',
        COLLECTIONS: 'collections',
        EXPENSES: 'expenses',
        REPORTS: 'reports'
    }
};

