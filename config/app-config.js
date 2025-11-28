// Application Configuration
const APP_CONFIG = {
    // Maintenance Settings
    DEFAULT_MAINTENANCE_PER_FLAT: 2000,
    TOTAL_FLATS: 8,
    
    // Storage Keys
    STORAGE_KEYS: {
        EXPENSES: 'apartment_maintenance_expenses',
        SETTINGS: 'apartment_maintenance_settings',
        COLLECTIONS: 'apartment_maintenance_collections'
    },
    
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

